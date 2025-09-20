
"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Bell, User, HelpCircle, Link, Globe, Upload, Mic, Send, Bot, Play, Square, Volume2 } from "lucide-react"
import { ThemeSwitcher } from "./theme-switcher"

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  audioBlob?: Blob
  audioUrl?: string
  hasAudio?: boolean
}

// Predefined Q&A responses
const qaResponses: Record<string, string> = {
  "what is the last date of fees submission?": "Last date for fees submission is 22 September.",
  "ꯁꯤꯍ ꯔꯤꯖꯦꯁ꯭ꯠꯔꯦꯁꯅꯒꯤ ꯑꯔꯣꯏꯕꯥ ꯇꯥꯡ ꯑꯗꯨ ꯀꯔꯤꯅꯣ?": "ꯁꯤꯍ ꯔꯦꯖꯤꯁ꯭ꯠꯔꯦꯁꯅꯒꯤ ꯑꯔꯣꯏꯕꯥ ꯇꯥꯡ ꯑꯁꯤ ꯁꯦꯞꯇꯦꯝꯕꯔ ꯲꯰ꯅꯤ꯫",
  "कॉलेज कब तक खुला रहेगा?": "कॉलेज 6 बजे तक खुला रहेगा.",
}

export function StudentBotInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your Student Bot assistant. How can I help you?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      console.log('Starting recording...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      })
      
      // Check supported MIME types
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm'
      }

      console.log('Using MIME type:', mimeType)

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: mimeType
      })
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log('Audio data received:', event.data.size, 'bytes')
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        console.log('Recording stopped. Total chunks:', audioChunksRef.current.length)
        
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mimeType
          })
          console.log('Created audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type)
          handleAudioMessage(audioBlob)
        } else {
          console.warn('No audio chunks recorded')
        }
        
        // Clean up stream
        stream.getTracks().forEach(track => {
          track.stop()
          console.log('Stopped track:', track.kind)
        })
      }

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setIsRecording(false)
        alert('Recording failed. Please try again.')
      }

      mediaRecorderRef.current.start(100) // Collect data every 100ms for better quality
      setIsRecording(true)
      console.log('Recording started successfully')

    } catch (error) {
      console.error('Error starting recording:', error)
      setIsRecording(false)
      alert('Could not start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = () => {
    console.log('Stopping recording...')
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handleAudioMessage = (audioBlob: Blob) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content: "🎤 Voice message",
      sender: "user",
      timestamp: new Date(),
      audioBlob: audioBlob,
      hasAudio: true,
    }

    setMessages((prev) => [...prev, userMessage])

    // Bot response with static MP3 audio
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "🔊 Audio response",
        sender: "bot",
        timestamp: new Date(),
        audioUrl: "/audio/response.mp3", // This should be in your public folder
        hasAudio: true,
      }
      setMessages((prev) => [...prev, botResponse])
    }, 800)
  }

  const playAudio = async (messageId: string, message: Message) => {
    console.log('Playing audio for message:', messageId)
    
    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
      setPlayingAudio(null)
    }

    try {
      const audio = new Audio()
      currentAudioRef.current = audio

      if (message.audioBlob) {
        // User recorded audio
        const audioUrl = URL.createObjectURL(message.audioBlob)
        audio.src = audioUrl
        console.log('Playing user audio blob')
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          setPlayingAudio(null)
          currentAudioRef.current = null
        }
      } else if (message.audioUrl) {
        // Bot static audio file
        console.log('Playing bot audio from URL:', message.audioUrl)
        audio.src = message.audioUrl
        
        audio.onended = () => {
          setPlayingAudio(null)
          currentAudioRef.current = null
        }
      } else {
        console.error('No audio source available')
        return
      }

      audio.onerror = (e) => {
        console.error('Audio playback error:', e)
        console.error('Audio error details:', audio.error)
        setPlayingAudio(null)
        currentAudioRef.current = null
        alert('Could not play audio. Please check if the file exists and is accessible.')
      }

      audio.onloadstart = () => console.log('Audio loading started')
      audio.oncanplay = () => console.log('Audio can start playing')
      audio.onplaying = () => console.log('Audio is playing')

      setPlayingAudio(messageId)

      // Load and play
      audio.load()
      await audio.play()
      console.log('Audio playback started successfully')

    } catch (error) {
      console.error('Error playing audio:', error)
      setPlayingAudio(null)
      currentAudioRef.current = null
      alert('Failed to play audio: ' + error.message)
    }
  }

  const stopAudio = () => {
    console.log('Stopping audio playback')
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
      setPlayingAudio(null)
    }
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    const lowerInput = inputValue.trim().toLowerCase()
    setInputValue("")

    // Check predefined answers
    const answer = qaResponses[inputValue.trim()] || qaResponses[lowerInput]

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content:
          answer || "I'm not sure about that. Try connecting authorities and volunteers via CONNECT.",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
    }, 800)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Student Bot</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3">
            <Bell className="h-5 w-5" />
            <span className="text-xs">Notice Board</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3">
            <User className="h-5 w-5" />
            <span className="text-xs">My Context</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 px-3">
            <HelpCircle className="h-5 w-5" />
            <span className="text-xs">FAQ's</span>
          </Button>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <Card
              className={`max-w-[80%] p-4 ${
                message.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-card-foreground border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                {message.sender === "bot" && <Bot className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  
                  {/* Audio Player for messages with audio */}
                  {message.hasAudio && (
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (playingAudio === message.id) {
                            stopAudio()
                          } else {
                            playAudio(message.id, message)
                          }
                        }}
                        className="flex items-center gap-2 text-xs"
                      >
                        {playingAudio === message.id ? (
                          <>
                            <Square className="h-3 w-3" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" />
                            <span>Play</span>
                          </>
                        )}
                      </Button>
                      <Volume2 className="h-4 w-4 opacity-60" />
                      {playingAudio === message.id && (
                        <span className="text-xs text-green-500 animate-pulse">Playing...</span>
                      )}
                    </div>
                  )}
                  
                  <span className="text-xs opacity-70 mt-2 block">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Bottom Control Area */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex items-center justify-center gap-6 mb-4">
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto">
            <Link className="h-5 w-5" />
            <span className="text-xs">Connect</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto">
            <Globe className="h-5 w-5" />
            <span className="text-xs">Language</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto">
            <Upload className="h-5 w-5" />
            <span className="text-xs">Drag & Drop</span>
          </Button>
        </div>

        {/* Input */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              className="pr-12 bg-input border-border"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 transition-colors ${
                isRecording 
                  ? 'text-red-500 bg-red-50 hover:bg-red-100 animate-pulse' 
                  : 'hover:text-primary'
              }`}
              onClick={handleMicClick}
              title={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleSendMessage} size="sm" className="h-10 w-10 p-0" disabled={!inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-600 font-medium">Recording... Click mic to stop</span>
          </div>
        )}
      </div>
    </div>
  )
}