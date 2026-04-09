"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ConfiguracionSitio } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ConfiguracionForm({ config }: { config: ConfiguracionSitio }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [nombreNegocio, setNombreNegocio] = useState(config.nombreNegocio);
  const [slogan, setSlogan] = useState(config.slogan || "");
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || "");
  const [colorPrimario, setColorPrimario] = useState(config.colorPrimario);
  const [colorSecundario, setColorSecundario] = useState(config.colorSecundario);
  const [heroTitulo, setHeroTitulo] = useState(config.heroTitulo || "");
  const [heroSubtitulo, setHeroSubtitulo] = useState(config.heroSubtitulo || "");
  const [whatsapp, setWhatsapp] = useState(config.whatsappPrincipal || "");
  const [emailContacto, setEmailContacto] = useState(config.emailContacto || "");
  const [facebookUrl, setFacebookUrl] = useState(config.facebookUrl || "");
  const [instagramUrl, setInstagramUrl] = useState(config.instagramUrl || "");
  const [tiktokUrl, setTiktokUrl] = useState(config.tiktokUrl || "");
  const [textoLegal, setTextoLegal] = useState(config.textoLegal || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      nombreNegocio: nombreNegocio.trim(),
      slogan: slogan.trim() || null,
      logoUrl: logoUrl.trim() || null,
      colorPrimario,
      colorSecundario,
      heroTitulo: heroTitulo.trim() || null,
      heroSubtitulo: heroSubtitulo.trim() || null,
      whatsappPrincipal: whatsapp.trim() || null,
      emailContacto: emailContacto.trim() || null,
      facebookUrl: facebookUrl.trim() || null,
      instagramUrl: instagramUrl.trim() || null,
      tiktokUrl: tiktokUrl.trim() || null,
      textoLegal: textoLegal.trim() || null,
    };

    startTransition(async () => {
      const res = await fetch("/api/admin/configuracion", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error("No se pudo guardar", { description: err.error });
        return;
      }

      toast.success("Configuración guardada");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Marca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombreNegocio">Nombre del negocio</Label>
            <Input
              id="nombreNegocio"
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slogan">Slogan</Label>
            <Input
              id="slogan"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="Belleza al alcance de todas"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">URL del logo</Label>
            <Input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Colores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="colorPrimario">Color primario</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={colorPrimario}
                  onChange={(e) => setColorPrimario(e.target.value)}
                  className="h-10 w-20 cursor-pointer rounded border"
                />
                <Input
                  id="colorPrimario"
                  value={colorPrimario}
                  onChange={(e) => setColorPrimario(e.target.value)}
                  placeholder="#E91E63"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorSecundario">Color secundario</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={colorSecundario}
                  onChange={(e) => setColorSecundario(e.target.value)}
                  className="h-10 w-20 cursor-pointer rounded border"
                />
                <Input
                  id="colorSecundario"
                  value={colorSecundario}
                  onChange={(e) => setColorSecundario(e.target.value)}
                  placeholder="#F8BBD0"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hero / Portada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heroTitulo">Título del hero</Label>
            <Input
              id="heroTitulo"
              value={heroTitulo}
              onChange={(e) => setHeroTitulo(e.target.value)}
              maxLength={120}
              placeholder="Belleza al alcance, emoción garantizada"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heroSubtitulo">Subtítulo</Label>
            <Textarea
              id="heroSubtitulo"
              value={heroSubtitulo}
              onChange={(e) => setHeroSubtitulo(e.target.value)}
              maxLength={300}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp principal (10 dígitos)</Label>
            <Input
              id="whatsapp"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="3312345678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailContacto">Email de contacto</Label>
            <Input
              id="emailContacto"
              type="email"
              value={emailContacto}
              onChange={(e) => setEmailContacto(e.target.value)}
              placeholder="contacto@asha.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redes sociales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facebookUrl">Facebook</Label>
            <Input
              id="facebookUrl"
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagramUrl">Instagram</Label>
            <Input
              id="instagramUrl"
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktokUrl">TikTok</Label>
            <Input
              id="tiktokUrl"
              type="url"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              placeholder="https://tiktok.com/@..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Texto legal</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={textoLegal}
            onChange={(e) => setTextoLegal(e.target.value)}
            placeholder="Aviso de privacidad, términos, etc..."
            rows={4}
            maxLength={2000}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending} size="lg">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
