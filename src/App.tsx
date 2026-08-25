import { useEffect, useRef, useState } from 'react'
import {
  Send,
  Bot,
  User,
  SquarePen,
  UserRound,
  Sun,
  Moon,
  Paperclip,
  FileText,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ChatMarkdown } from '@/components/chat-markdown'
import { cn } from '@/lib/utils'

type Attachment = {
  id: string
  name: string
  type: string
  size: number
  dataUrl: string
  textContent?: string
}

type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
  attachments?: Attachment[]
}

type Theme = 'light' | 'dark'

const USER_NAME_KEY = 'chaztia_user_name'
const THEME_KEY = 'chaztia_theme'
const AVATAR_KEY = 'chaztia_avatar'

const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const AVATAR_SIZE = 160

const MAX_ATTACHMENTS = 5
const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024 // 8MB
const MAX_ATTACHMENT_CONTEXT_CHARS = 12000
const TEXT_ATTACHMENT_EXTENSIONS = [
  '.txt', '.md', '.csv', '.json', '.xml', '.yml', '.yaml', '.log',
  '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.cs',
  '.go', '.rb', '.php', '.html', '.css', '.sql', '.sh',
]

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('El archivo no es una imagen válida'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = AVATAR_SIZE
        canvas.height = AVATAR_SIZE

        const scale = Math.max(AVATAR_SIZE / img.width, AVATAR_SIZE / img.height)
        const w = img.width * scale
        const h = img.height * scale

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No se pudo procesar la imagen'))
          return
        }
        ctx.drawImage(img, (AVATAR_SIZE - w) / 2, (AVATAR_SIZE - h) / 2, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

function isTextLikeFile(file: File): boolean {
  if (file.type.startsWith('text/')) return true
  if (
    ['application/json', 'application/xml', 'application/javascript'].includes(
      file.type
    )
  ) {
    return true
  }
  const lowerName = file.name.toLowerCase()
  return TEXT_ATTACHMENT_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
}

async function fileToAttachment(file: File): Promise<Attachment> {
  const dataUrl = await readFileAsDataUrl(file)
  const attachment: Attachment = {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    dataUrl,
  }

  if (isTextLikeFile(file)) {
    try {
      attachment.textContent = await file.text()
    } catch {
      // sin contenido de texto disponible, se mantiene solo como archivo
    }
  }

  return attachment
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function buildContentForApi(message: Message): string {
  if (!message.attachments || message.attachments.length === 0) {
    return message.content
  }

  const parts = [message.content]
  for (const attachment of message.attachments) {
    if (attachment.textContent) {
      const truncated =
        attachment.textContent.length > MAX_ATTACHMENT_CONTEXT_CHARS
          ? `${attachment.textContent.slice(0, MAX_ATTACHMENT_CONTEXT_CHARS)}\n... (contenido truncado)`
          : attachment.textContent
      parts.push(`\n\nArchivo adjunto "${attachment.name}":\n\`\`\`\n${truncated}\n\`\`\``)
    } else {
      parts.push(
        `\n\n[Archivo adjunto: ${attachment.name} (${attachment.type}, ${formatFileSize(attachment.size)}) — contenido no disponible como texto]`
      )
    }
  }
  return parts.join('')
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme | null) ?? 'light'
  )
  const [userName, setUserName] = useState(
    () => localStorage.getItem(USER_NAME_KEY) ?? ''
  )
  const [avatar, setAvatar] = useState<string | null>(
    () => localStorage.getItem(AVATAR_KEY)
  )
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    applyTheme(theme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  const sendMessage = async () => {
    const content = input.trim()
    if ((!content && pendingAttachments.length === 0) || loading) return

    const userMessage: Message = {
      role: 'user',
      content,
      attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
    }

    const nextMessages: Message[] = [...messages, userMessage]
    setStarted(true)
    setMessages(nextMessages)
    setInput('')
    setPendingAttachments([])
    setAttachmentError(null)
    setError(null)
    setLoading(true)
    scrollToBottom()

    const trimmedName = userName.trim()
    const requestMessages = (
      trimmedName
        ? [
            {
              role: 'system' as const,
              content: `El usuario quiere que le llames "${trimmedName}" durante toda la conversación.`,
            },
            ...nextMessages,
          ]
        : nextMessages
    ).map((message) => ({
      role: message.role,
      content: buildContentForApi(message),
    }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: requestMessages }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error ?? 'Error al contactar al asistente')
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal')
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAvatarError('El archivo debe ser una imagen.')
      return
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setAvatarError('La imagen es demasiado grande. Máximo 5MB.')
      return
    }

    try {
      const dataUrl = await resizeImageToDataUrl(file)
      setAvatar(dataUrl)
      setAvatarError(null)
    } catch {
      setAvatarError('No se pudo procesar la imagen.')
    }
  }

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    setAttachmentError(null)

    if (pendingAttachments.length + files.length > MAX_ATTACHMENTS) {
      setAttachmentError(`Máximo ${MAX_ATTACHMENTS} archivos por mensaje.`)
      return
    }

    const oversized = files.find((file) => file.size > MAX_ATTACHMENT_SIZE)
    if (oversized) {
      setAttachmentError(`"${oversized.name}" supera el tamaño máximo (8MB).`)
      return
    }

    try {
      const newAttachments = await Promise.all(files.map(fileToAttachment))
      setPendingAttachments((prev) => [...prev, ...newAttachments])
    } catch {
      setAttachmentError('No se pudieron procesar algunos archivos.')
    }
  }

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const savePreferences = () => {
    localStorage.setItem(USER_NAME_KEY, userName.trim())
    localStorage.setItem(THEME_KEY, theme)
    if (avatar) {
      localStorage.setItem(AVATAR_KEY, avatar)
    } else {
      localStorage.removeItem(AVATAR_KEY)
    }
    applyTheme(theme)
    setPreferencesOpen(false)
  }

  const newConversation = () => {
    setMessages([])
    setInput('')
    setError(null)
    setLoading(false)
    setStarted(false)
    setPendingAttachments([])
    setAttachmentError(null)
  }

  return (
    <div className="mx-auto flex h-svh max-w-4xl flex-col p-4">
      <header className="mb-4 flex items-center gap-2 border-b pb-4">
        <img src="/favicon.png" alt="ChaztIa" className="size-6" />
        <h1 className="text-lg font-semibold">Chaztia</h1>
        {started && (
          <Button
            onClick={newConversation}
            variant="outline"
            className="ml-auto cursor-pointer"
          >
            <SquarePen className="size-4" />
            Nueva conversación
          </Button>
        )}
        <Button
          onClick={() => setPreferencesOpen(true)}
          variant="ghost"
          size="icon"
          title="Perfil y preferencias"
          className={cn('cursor-pointer rounded-full', !started && 'ml-auto')}
        >
          <Avatar className="size-8">
            {avatar && <AvatarImage src={avatar} alt="Foto de perfil" />}
            <AvatarFallback>
              <UserRound className="size-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </header>

      <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preferencias</DialogTitle>
            <DialogDescription>
              Personaliza tu experiencia en Chaztia.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-2 py-2">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="group relative cursor-pointer rounded-full"
              title="Cambiar foto de perfil"
            >
              <Avatar size="lg" className="size-20">
                {avatar && <AvatarImage src={avatar} alt="Foto de perfil" />}
                <AvatarFallback>
                  <UserRound className="size-8" />
                </AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                Cambiar
              </span>
            </button>
            {avatarError && (
              <p className="text-xs text-destructive">{avatarError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              JPG o PNG, máximo 5MB.
            </p>
          </div>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="user-name">¿Cómo quieres que te llame la IA?</Label>
            <Input
              id="user-name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Ej: Cesar"
            />
          </div>
          <div className="flex flex-col gap-2 py-2">
            <Label>Tema</Label>
            <div className="inline-flex gap-1 self-start rounded-full border bg-muted p-1">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  theme === 'light'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Sun className="size-4" />
                Claro
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  theme === 'dark'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Moon className="size-4" />
                Oscuro
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={savePreferences} className="cursor-pointer">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          className={cn(
            'overflow-y-auto pr-2 pb-4',
            started ? 'min-h-0 flex-1' : 'hidden'
          )}
        >
          <div className="flex flex-col gap-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-2 duration-300 animate-in fade-in slide-in-from-bottom-3',
                  message.role === 'user' && 'flex-row-reverse'
                )}
              >
                <Avatar className="size-8">
                  {message.role === 'user' && avatar && (
                    <AvatarImage src={avatar} alt="Tú" />
                  )}
                  <AvatarFallback>
                    {message.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
                  </AvatarFallback>
                </Avatar>
                <Card
                  className={cn(
                    'max-w-[80%] min-w-0 px-3 py-2 text-sm',
                    message.role === 'user' && 'bg-primary text-primary-foreground'
                  )}
                >
                  {message.content && <ChatMarkdown content={message.content} />}
                  {message.attachments && message.attachments.length > 0 && (
                    <div
                      className={cn(
                        'flex flex-wrap gap-2',
                        message.content && 'mt-2'
                      )}
                    >
                      {message.attachments.map((attachment) =>
                        attachment.type.startsWith('image/') ? (
                          <img
                            key={attachment.id}
                            src={attachment.dataUrl}
                            alt={attachment.name}
                            className="size-24 rounded-md border object-cover"
                          />
                        ) : (
                          <a
                            key={attachment.id}
                            href={attachment.dataUrl}
                            download={attachment.name}
                            className="flex items-center gap-2 rounded-md border bg-background/50 px-2 py-1.5 text-xs text-foreground"
                          >
                            <FileText className="size-4 shrink-0" />
                            <span className="max-w-32 truncate">{attachment.name}</span>
                            <span className="text-muted-foreground">
                              {formatFileSize(attachment.size)}
                            </span>
                          </a>
                        )
                      )}
                    </div>
                  )}
                </Card>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2 duration-300 animate-in fade-in slide-in-from-bottom-3">
                <Avatar className="size-8">
                  <AvatarFallback>
                    <Bot className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <Card className="max-w-[80%] px-3 py-2 text-sm text-muted-foreground">
                  Escribiendo...
                </Card>
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            'flex flex-col gap-2',
            started ? 'border-t pt-4' : 'min-h-0 flex-1 items-center justify-center'
          )}
        >
          {!started && (
            <p className="mb-2 text-center text-lg font-medium text-muted-foreground duration-500 animate-in fade-in">
              ¿En qué puedo ayudarte{userName.trim() ? `, ${userName.trim()}` : ''}?
            </p>
          )}
          <div
            className={cn(
              'duration-700 animate-in fade-in zoom-in-95',
              !started && 'w-full'
            )}
          >
            {pendingAttachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {pendingAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-1.5 rounded-md border bg-muted px-2 py-1 text-xs"
                  >
                    {attachment.type.startsWith('image/') ? (
                      <img
                        src={attachment.dataUrl}
                        alt={attachment.name}
                        className="size-6 rounded object-cover"
                      />
                    ) : (
                      <FileText className="size-4 text-muted-foreground" />
                    )}
                    <span className="max-w-28 truncate">{attachment.name}</span>
                    <button
                      type="button"
                      onClick={() => removePendingAttachment(attachment.id)}
                      className="cursor-pointer rounded-full p-0.5 hover:bg-background"
                      title="Quitar archivo"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {attachmentError && (
              <p className="mb-2 text-xs text-destructive">{attachmentError}</p>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
                accept="image/*,.txt,.md,.csv,.json,.xml,.yml,.yaml,.log,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.go,.rb,.php,.html,.css,.sql,.sh,.pdf,.doc,.docx"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 cursor-pointer"
                title="Adjuntar archivo"
              >
                <Paperclip className="size-4" />
              </Button>
              <div className="relative flex-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu mensaje..."
                  disabled={loading}
                  autoFocus
                  className="h-11 bg-background pr-11 pl-4 text-base shadow-sm"
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || (!input.trim() && pendingAttachments.length === 0)}
                  size="icon"
                  className="absolute top-1/2 right-1 size-8 -translate-y-1/2 cursor-pointer"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </div>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  )
}

export default App
