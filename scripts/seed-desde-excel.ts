/**
 * Seed desde el Excel "Control_Ventas_Maquillaje NAT JAZ.xlsx".
 *
 * Pre-requisitos:
 *   1. Correr primero: python scripts/extraer-excel.py
 *      Esto genera scripts/tmp-excel/{productos.json, dinamicas.json, imagenes/}
 *   2. Bucket "productos-publico" debe existir (scripts/setup-storage.ts)
 *
 * Uso:
 *   npx tsx scripts/seed-desde-excel.ts           # dry-run (default)
 *   npx tsx scripts/seed-desde-excel.ts --commit  # ejecuta cambios reales
 *
 * Fases:
 *   A — Productos + variantes (consolida 71 filas → ~50 productos)
 *   B — Imágenes (72 PNG → Supabase Storage + ImagenProducto)
 *   C — Clientas (dedupe por teléfono desde las 3 dinámicas)
 *   D — Dinámicas históricas (D1/D2 ENTREGADA sin ganadora, D3 ACTIVA)
 *
 * Idempotente: upserts por nombre (productos), teléfono (clientas), nombre (dinámicas).
 */

import { PrismaClient, type CategoriaProducto } from "@prisma/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const COMMIT = process.argv.includes("--commit");
const TMP_DIR = path.resolve(process.cwd(), "scripts/tmp-excel");
const IMG_DIR = path.join(TMP_DIR, "imagenes");
const REPORT_PATH = path.resolve(
  process.cwd(),
  "scripts/seed-excel-report.txt"
);
const BUCKET = "productos-publico";

const prisma = new PrismaClient();

// ---------- Tipos de los JSON extraídos ----------
interface ExcelProducto {
  row: number;
  numero: number;
  nombre: string;
  costo: number | null;
  precio: number | null;
  vendidas: number;
}

interface ExcelImagenManifest {
  row: number;
  filename: string;
  bytes: number;
}

interface ExcelDinamicaBoleto {
  numero: number;
  nombre: string | null;
  telefono: string | null;
  pagado: boolean;
  precio: number | null;
}

interface ExcelDinamica {
  num: number;
  precioDefault: number | null;
  totalBoletos: number;
  boletos: ExcelDinamicaBoleto[];
}

// ---------- Logging ----------
const logLines: string[] = [];
function log(msg: string) {
  console.log(msg);
  logLines.push(msg);
}
function warn(msg: string) {
  const m = `  [warn] ${msg}`;
  console.warn(m);
  logLines.push(m);
}

// ---------- Consolidación de productos ----------
// Tokens que marcan una variante de color/sabor al final del nombre.
// Los compuestos se prueban primero.
const VARIANT_TOKENS_COMPOUND = [
  "CAFE CLARO",
  "CAFÉ CLARO",
  "CAFE OSCURO",
  "CAFÉ OSCURO",
];
const VARIANT_TOKENS = [
  "CHERRY",
  "FIUCHA",
  "FUCSIA",
  "ORANGE",
  "COCO",
  "NUDE",
  "ROSA",
  "ROJO",
];

function normalizarNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ")
    .trim();
}

function extraerVariante(
  nombreNorm: string
): { base: string; variante: string | null } {
  for (const token of VARIANT_TOKENS_COMPOUND) {
    if (nombreNorm.endsWith(" " + token)) {
      return {
        base: nombreNorm.slice(0, -(token.length + 1)).trim(),
        variante: titleCase(token),
      };
    }
  }
  for (const token of VARIANT_TOKENS) {
    if (nombreNorm.endsWith(" " + token)) {
      return {
        base: nombreNorm.slice(0, -(token.length + 1)).trim(),
        variante: titleCase(token),
      };
    }
  }
  return { base: nombreNorm, variante: null };
}

function inferirCategoria(nombre: string): CategoriaProducto {
  const n = nombre.toUpperCase();
  // Orden importa: más específico primero
  if (/HIALURONIC|HIDRO|SALICYLIC|SERUM|ORDINARY|PIXI/.test(n))
    return "CUIDADO_PIEL";
  if (/LABIAL|LIPSTICK|\bLIP\b|TINTA|BALSAMO|BALM/.test(n)) return "LABIALES";
  if (/RIMEL|MASCARA|SHADOW|SOMBRA|DELINEADOR|CEJA|CEJAS|BROW/.test(n))
    return "OJOS";
  if (/BLUSH|RUBOR/.test(n)) return "RUBORES";
  if (/BROCHA|BRUSH/.test(n)) return "BROCHAS";
  if (/\bKIT\b|\bDUO\b|PALETTE|PALETA/.test(n)) return "KITS";
  if (/BASE|FOUNDATION|CREAM|POLVO|PRIMER/.test(n)) return "BASES";
  return "OTROS";
}

interface ProductoConsolidado {
  nombreBase: string; // forma title-cased
  nombreNormalizado: string; // uppercase/sin acentos — clave de upsert
  precio: number;
  categoria: CategoriaProducto;
  variantes: string[]; // nombres title-cased, sin duplicados
  rowsOrigen: number[]; // filas del Excel que aportaron datos (para mapear imágenes)
}

function consolidarProductos(
  productos: ExcelProducto[]
): ProductoConsolidado[] {
  // Paso 1: a cada fila, extraer base + variante
  const filas = productos.map((p) => {
    const norm = normalizarNombre(p.nombre);
    const { base, variante } = extraerVariante(norm);
    return { ...p, norm, base, variante };
  });

  // Paso 2: agrupar por base
  const grupos = new Map<string, typeof filas>();
  for (const f of filas) {
    if (!grupos.has(f.base)) grupos.set(f.base, []);
    grupos.get(f.base)!.push(f);
  }

  // Paso 3: producir un ProductoConsolidado por grupo
  const resultado: ProductoConsolidado[] = [];
  for (const [base, entries] of grupos) {
    const variantesSet = new Set<string>();
    for (const e of entries) if (e.variante) variantesSet.add(e.variante);

    // Precio: el más alto de los registros con precio válido (más representativo del venta actual)
    const precios = entries
      .map((e) => e.precio)
      .filter((p): p is number => typeof p === "number" && p > 0);
    const precio = precios.length > 0 ? Math.max(...precios) : 0;

    resultado.push({
      nombreBase: titleCase(base),
      nombreNormalizado: base,
      precio,
      categoria: inferirCategoria(base),
      variantes: [...variantesSet],
      rowsOrigen: entries.map((e) => e.row),
    });
  }

  // Ordenar alfabéticamente para reporte estable
  resultado.sort((a, b) => a.nombreBase.localeCompare(b.nombreBase));
  return resultado;
}

// ---------- Normalización de teléfonos ----------
function normalizarTelefono(tel: string | null): string | null {
  if (!tel) return null;
  const digits = tel.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("52")) return digits.slice(2);
  return null;
}

function normalizarNombreClienta(n: string): string {
  return titleCase(
    n
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

// ---------- Fase A: Productos ----------
async function faseProductos(
  productosExcel: ExcelProducto[]
): Promise<Map<number, string>> {
  log("\n========== FASE A: PRODUCTOS ==========");
  const consolidados = consolidarProductos(productosExcel);

  log(`  filas Excel: ${productosExcel.length}`);
  log(`  productos consolidados: ${consolidados.length}`);

  let conVariantes = 0;
  let consolidaciones = 0;
  for (const p of consolidados) {
    if (p.variantes.length > 0) conVariantes++;
    if (p.rowsOrigen.length > 1) consolidaciones++;
    const varStr =
      p.variantes.length > 0 ? ` [variantes: ${p.variantes.join(", ")}]` : "";
    const restockStr =
      p.rowsOrigen.length > 1 ? ` (x${p.rowsOrigen.length})` : "";
    log(
      `    ${p.categoria.padEnd(13)} · ${p.nombreBase}${varStr}${restockStr} · $${p.precio}`
    );
  }
  log(`  con variantes: ${conVariantes}`);
  log(`  consolidados por nombre (restock o variantes): ${consolidaciones}`);

  const rowToProductoId = new Map<number, string>();
  if (!COMMIT) {
    log("  [dry-run] no se insertan productos");
    return rowToProductoId;
  }

  // Upsert por nombre — schema no tiene unique(nombre), así que hago findFirst + create/update
  for (const p of consolidados) {
    const existe = await prisma.producto.findFirst({
      where: { nombre: p.nombreBase },
    });
    let productoId: string;
    const data = {
      nombre: p.nombreBase,
      precio: p.precio,
      categoria: p.categoria,
      variantes:
        p.variantes.length > 0
          ? p.variantes.map((v) => ({ nombre: v }))
          : undefined,
    };
    if (existe) {
      const updated = await prisma.producto.update({
        where: { id: existe.id },
        data,
      });
      productoId = updated.id;
    } else {
      const created = await prisma.producto.create({ data });
      productoId = created.id;
    }
    for (const row of p.rowsOrigen) rowToProductoId.set(row, productoId);
  }
  log(`  productos insertados/actualizados: ${consolidados.length}`);
  return rowToProductoId;
}

// ---------- Fase B: Imágenes ----------
async function faseImagenes(
  rowToProductoId: Map<number, string>,
  supabase: SupabaseClient
) {
  log("\n========== FASE B: IMÁGENES ==========");
  const manifestPath = path.join(IMG_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    warn("no existe manifest.json, saltando fase B");
    return;
  }
  const manifest: ExcelImagenManifest[] = JSON.parse(
    fs.readFileSync(manifestPath, "utf-8")
  );
  log(`  imágenes en manifest: ${manifest.length}`);

  const ordenPorProducto = new Map<string, number>();
  let uploaded = 0;
  let skipped = 0;

  for (const img of manifest) {
    const productoId = rowToProductoId.get(img.row);
    if (!productoId) {
      warn(`imagen ${img.filename} (row ${img.row}) sin producto asociado`);
      skipped++;
      continue;
    }
    const orden = ordenPorProducto.get(productoId) ?? 0;
    ordenPorProducto.set(productoId, orden + 1);

    const localPath = path.join(IMG_DIR, img.filename);
    if (!fs.existsSync(localPath)) {
      warn(`archivo no existe: ${localPath}`);
      skipped++;
      continue;
    }

    const ext = path.extname(img.filename).slice(1) || "png";
    const storagePath = `productos/${productoId}/${orden}.${ext}`;

    if (!COMMIT) {
      log(`    [dry] ${img.filename} → ${storagePath}`);
      uploaded++;
      continue;
    }

    const fileBytes = fs.readFileSync(localPath);
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBytes, {
        contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        upsert: true,
      });
    if (upErr) {
      warn(`upload falló ${storagePath}: ${upErr.message}`);
      skipped++;
      continue;
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const url = pub.publicUrl;

    // Evitar duplicados de ImagenProducto por URL
    const existe = await prisma.imagenProducto.findFirst({
      where: { productoId, url },
    });
    if (existe) {
      await prisma.imagenProducto.update({
        where: { id: existe.id },
        data: { orden },
      });
    } else {
      await prisma.imagenProducto.create({
        data: { productoId, url, orden },
      });
    }
    uploaded++;
  }
  log(`  ${COMMIT ? "subidas" : "dry"}: ${uploaded}, saltadas: ${skipped}`);
}

// ---------- Fase C: Clientas ----------
async function faseClientas(
  dinamicasExcel: ExcelDinamica[]
): Promise<Map<string, string>> {
  log("\n========== FASE C: CLIENTAS ==========");

  // Dedup por teléfono, priorizando el primer nombre encontrado
  const porTelefono = new Map<string, string>(); // tel → nombre
  let sinTelefono = 0;
  const nombresSinTel: string[] = [];

  for (const d of dinamicasExcel) {
    for (const b of d.boletos) {
      if (!b.nombre) continue;
      const tel = normalizarTelefono(b.telefono);
      const nombreLimpio = normalizarNombreClienta(b.nombre);
      if (!tel) {
        sinTelefono++;
        nombresSinTel.push(`D${d.num}#${b.numero} ${nombreLimpio}`);
        continue;
      }
      if (!porTelefono.has(tel)) porTelefono.set(tel, nombreLimpio);
    }
  }

  log(`  clientas únicas por teléfono: ${porTelefono.size}`);
  if (sinTelefono > 0) {
    log(
      `  boletos con nombre pero sin teléfono válido: ${sinTelefono} (se registran solo en el boleto, sin Clienta)`
    );
    for (const n of nombresSinTel.slice(0, 10)) log(`    - ${n}`);
    if (nombresSinTel.length > 10) log(`    ... +${nombresSinTel.length - 10} más`);
  }

  const telToClientaId = new Map<string, string>();
  if (!COMMIT) {
    log("  [dry-run] no se insertan clientas");
    return telToClientaId;
  }

  for (const [tel, nombre] of porTelefono) {
    const clienta = await prisma.clienta.upsert({
      where: { telefono: tel },
      create: { telefono: tel, nombre, municipio: null, puntos: 0 },
      update: {}, // no pisar nombre si ya existe
    });
    telToClientaId.set(tel, clienta.id);
  }
  log(`  clientas upserted: ${telToClientaId.size}`);
  return telToClientaId;
}

// ---------- Fase D: Dinámicas históricas ----------
async function faseDinamicas(
  dinamicasExcel: ExcelDinamica[],
  telToClientaId: Map<string, string>
) {
  log("\n========== FASE D: DINÁMICAS HISTÓRICAS ==========");

  // Metadatos por dinámica histórica
  const meta: Record<
    number,
    { nombre: string; estatus: "ENTREGADA" | "ACTIVA"; desc: string }
  > = {
    1: {
      nombre: "Dinámica 1 (histórica)",
      estatus: "ENTREGADA",
      desc:
        "Dinámica realizada antes del sistema de selección verificable. Ganadora registrada manualmente.",
    },
    2: {
      nombre: "Dinámica 2 (histórica)",
      estatus: "ENTREGADA",
      desc:
        "Dinámica realizada antes del sistema de selección verificable. Ganadora registrada manualmente.",
    },
    3: {
      nombre: "Dinámica 3 (histórica - en curso)",
      estatus: "ACTIVA",
      desc:
        "Dinámica iniciada antes del sistema verificable, se continúa manualmente desde el dashboard.",
    },
  };

  for (const d of dinamicasExcel) {
    const m = meta[d.num];
    if (!m) continue;
    const llenos = d.boletos.filter((b) => b.nombre).length;
    log(`  D${d.num}: ${m.nombre}`);
    log(
      `    total=${d.totalBoletos} llenos=${llenos} precio=$${d.precioDefault} estatus=${m.estatus}`
    );

    if (!COMMIT) continue;

    // Upsert por nombre (no hay @unique, uso findFirst)
    const existente = await prisma.dinamica.findFirst({
      where: { nombre: m.nombre },
    });

    const dinamicaData = {
      nombre: m.nombre,
      descripcion: m.desc,
      tipo: "CLASICA" as const,
      precioBoleto: d.precioDefault ?? 0,
      totalBoletos: d.totalBoletos,
      premioCustom: "(por definir — dinámica histórica)",
      estatus: m.estatus,
      esHistorico: true,
    };

    let dinamicaId: string;
    if (existente) {
      const upd = await prisma.dinamica.update({
        where: { id: existente.id },
        data: dinamicaData,
      });
      dinamicaId = upd.id;
      // Borrar boletos previos para re-insertar (idempotente)
      await prisma.boleto.deleteMany({ where: { dinamicaId } });
    } else {
      const creada = await prisma.dinamica.create({ data: dinamicaData });
      dinamicaId = creada.id;
    }

    // Crear boletos: uno por cada número de 1..totalBoletos
    const boletosData: Array<{
      dinamicaId: string;
      numero: number;
      estatus: "DISPONIBLE" | "CONFIRMADO";
      nombreCliente: string | null;
      telefonoCliente: string | null;
      clientaId: string | null;
      confirmadoEn: Date | null;
    }> = [];

    const porNumero = new Map<number, ExcelDinamicaBoleto>();
    for (const b of d.boletos) porNumero.set(b.numero, b);

    for (let n = 1; n <= d.totalBoletos; n++) {
      const b = porNumero.get(n);
      if (b && b.nombre) {
        const tel = normalizarTelefono(b.telefono);
        const clientaId = tel ? telToClientaId.get(tel) ?? null : null;
        boletosData.push({
          dinamicaId,
          numero: n,
          estatus: "CONFIRMADO",
          nombreCliente: normalizarNombreClienta(b.nombre),
          telefonoCliente: tel,
          clientaId,
          confirmadoEn: new Date(),
        });
      } else {
        boletosData.push({
          dinamicaId,
          numero: n,
          estatus: "DISPONIBLE",
          nombreCliente: null,
          telefonoCliente: null,
          clientaId: null,
          confirmadoEn: null,
        });
      }
    }
    await prisma.boleto.createMany({ data: boletosData });
    log(`    boletos creados: ${boletosData.length}`);
  }
}

// ---------- Main ----------
async function main() {
  const productosPath = path.join(TMP_DIR, "productos.json");
  const dinamicasPath = path.join(TMP_DIR, "dinamicas.json");
  if (!fs.existsSync(productosPath) || !fs.existsSync(dinamicasPath)) {
    console.error(
      "Faltan tmp-excel/{productos,dinamicas}.json — corre primero: python scripts/extraer-excel.py"
    );
    process.exit(1);
  }

  const productos: ExcelProducto[] = JSON.parse(
    fs.readFileSync(productosPath, "utf-8")
  );
  const dinamicas: ExcelDinamica[] = JSON.parse(
    fs.readFileSync(dinamicasPath, "utf-8")
  );

  log(`\n=== SEED DESDE EXCEL ===`);
  log(`modo: ${COMMIT ? "COMMIT (escribe BD)" : "DRY-RUN (sin cambios)"}`);
  log(`productos excel: ${productos.length}`);
  log(`dinámicas excel: ${dinamicas.length}`);

  // Supabase client (solo lo necesito en commit para storage)
  let supabase: SupabaseClient | null = null;
  if (COMMIT) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
      process.exit(1);
    }
    supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  const rowToProductoId = await faseProductos(productos);

  if (COMMIT && supabase) {
    await faseImagenes(rowToProductoId, supabase);
  } else {
    log("\n========== FASE B: IMÁGENES ==========");
    // En dry-run reportamos cuántas serían
    const manifestPath = path.join(IMG_DIR, "manifest.json");
    if (fs.existsSync(manifestPath)) {
      const manifest: ExcelImagenManifest[] = JSON.parse(
        fs.readFileSync(manifestPath, "utf-8")
      );
      log(`  imágenes en manifest: ${manifest.length} (se subirán en --commit)`);
    }
  }

  const telToClientaId = await faseClientas(dinamicas);
  await faseDinamicas(dinamicas, telToClientaId);

  log("\n=== DONE ===");
  fs.writeFileSync(REPORT_PATH, logLines.join("\n") + "\n");
  log(`reporte: ${REPORT_PATH}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
