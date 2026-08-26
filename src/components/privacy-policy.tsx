import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrivacyPolicy() {
  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col p-4">
      <header className="mb-6 flex items-center gap-2 border-b pb-4">
        <img src="/favicon.png" alt="ChaztIa" className="size-6" />
        <h1 className="text-lg font-semibold">Chaztia</h1>
        <Button
          onClick={() => {
            window.location.href = '/'
          }}
          variant="outline"
          className="ml-auto cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Button>
      </header>

      <main className="flex flex-col gap-5 pb-12 text-sm leading-relaxed text-foreground">
        <h2 className="text-2xl font-semibold">Política de privacidad</h2>
        <p className="text-muted-foreground">
          Última actualización: 26 de agosto de 2026
        </p>

        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">1. Uso no comercial</h3>
          <p>
            Chaztia es un proyecto de uso personal y no comercial, desarrollado con
            fines de aprendizaje, experimentación y como herramienta de utilidad para
            desarrolladores. No se ofrece como servicio de pago ni tiene ánimo de lucro.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">2. Qué información se guarda</h3>
          <p>
            Guardamos de forma estadística información básica y anónima de las visitas
            (por ejemplo, número de visitas, fecha y datos técnicos generales del
            navegador) con el único fin de conocer el uso de la aplicación y poder
            mejorarla.
          </p>
          <p>
            Además, algunas preferencias (nombre para dirigirse al usuario, tema claro/
            oscuro y foto de perfil) se guardan localmente en tu propio navegador
            (localStorage) para personalizar tu experiencia. Estos datos no salen de tu
            dispositivo salvo que decidas enviarlos como parte de una conversación con
            la IA.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">3. No vendemos tus datos</h3>
          <p>
            La información estadística de uso no se vende, cede ni comparte con
            terceros con fines comerciales o publicitarios. Únicamente se utiliza de
            forma interna para entender el uso de la aplicación.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">4. Conversaciones con la IA</h3>
          <p>
            Los mensajes y archivos que envíes al asistente se procesan para poder
            generar una respuesta. No los utilizamos para ningún otro fin distinto al
            de ofrecerte el servicio de chat.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">5. Exclusión de responsabilidad</h3>
          <p>
            Al tratarse de un proyecto personal, sin garantías ni soporte comercial, no
            nos hacemos responsables de posibles pérdidas de datos, interrupciones del
            servicio, errores en las respuestas generadas por la IA, ni de cualquier
            daño directo o indirecto derivado del uso de esta aplicación. El uso de
            Chaztia es bajo tu propia responsabilidad.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">6. Contacto</h3>
          <p>
            Si tienes dudas sobre esta política o quieres solicitar la eliminación de
            algún dato, puedes contactar a través del perfil de GitHub o LinkedIn
            enlazados en la propia aplicación.
          </p>
        </section>
      </main>
    </div>
  )
}
