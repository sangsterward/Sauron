import React, { useEffect, useRef, useState } from 'react'

interface Neuron {
  id: number
  x: number
  y: number
  size: number
  glow: number
  connections: number[]
}

interface Synapse {
  id: number
  from: number
  to: number
  active: boolean
  pulse: number
}

const BrainAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const mouseRef = useRef({ x: 0, y: 0 })
  const [neurons, setNeurons] = useState<Neuron[]>([])
  const [synapses, setSynapses] = useState<Synapse[]>([])

  // Initialize neurons and synapses
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Create neurons
    const newNeurons: Neuron[] = []
    const neuronCount = 15
    
    for (let i = 0; i < neuronCount; i++) {
      newNeurons.push({
        id: i,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 8 + 4,
        glow: Math.random() * 0.5 + 0.5,
        connections: []
      })
    }

    // Create synapses (connections between neurons)
    const newSynapses: Synapse[] = []
    for (let i = 0; i < newNeurons.length; i++) {
      for (let j = i + 1; j < newNeurons.length; j++) {
        const distance = Math.sqrt(
          Math.pow(newNeurons[i].x - newNeurons[j].x, 2) +
          Math.pow(newNeurons[i].y - newNeurons[j].y, 2)
        )
        
        // Only connect nearby neurons
        if (distance < 200 && Math.random() < 0.3) {
          newSynapses.push({
            id: newSynapses.length,
            from: i,
            to: j,
            active: false,
            pulse: Math.random() * Math.PI * 2
          })
        }
      }
    }

    setNeurons(newNeurons)
    setSynapses(newSynapses)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
      )
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)') // Deep blue
      gradient.addColorStop(1, 'rgba(6, 78, 59, 0.8)')   // Dark teal
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const mouse = mouseRef.current
      const time = Date.now() * 0.001

      // Update neurons
      const updatedNeurons = neurons.map((neuron, index) => {
        // Calculate distance to mouse
        const mouseDistance = Math.sqrt(
          Math.pow(neuron.x - mouse.x, 2) + Math.pow(neuron.y - mouse.y, 2)
        )

        // Mouse influence on glow
        const mouseInfluence = Math.max(0, 1 - mouseDistance / 150)
        const baseGlow = 0.5 + Math.sin(time * 2 + index) * 0.3
        const newGlow = Math.min(1, baseGlow + mouseInfluence * 0.8)

        return {
          ...neuron,
          glow: newGlow
        }
      })

      // Update synapses
      const updatedSynapses = synapses.map((synapse, index) => {
        const fromNeuron = updatedNeurons[synapse.from]
        const toNeuron = updatedNeurons[synapse.to]
        
        // Check if mouse is near the synapse
        const midX = (fromNeuron.x + toNeuron.x) / 2
        const midY = (fromNeuron.y + toNeuron.y) / 2
        const mouseDistance = Math.sqrt(
          Math.pow(midX - mouse.x, 2) + Math.pow(midY - mouse.y, 2)
        )

        const mouseInfluence = Math.max(0, 1 - mouseDistance / 100)
        const basePulse = time * 3 + index
        const newPulse = basePulse + mouseInfluence * 2

        return {
          ...synapse,
          active: mouseInfluence > 0.3 || Math.sin(newPulse) > 0.7,
          pulse: newPulse
        }
      })

      // Draw synapses first (behind neurons)
      updatedSynapses.forEach((synapse) => {
        const fromNeuron = updatedNeurons[synapse.from]
        const toNeuron = updatedNeurons[synapse.to]

        if (synapse.active) {
          // Active synapse - glowing connection
          const gradient = ctx.createLinearGradient(
            fromNeuron.x, fromNeuron.y, toNeuron.x, toNeuron.y
          )
          gradient.addColorStop(0, 'rgba(251, 146, 60, 0.8)') // Orange-red
          gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)') // White-hot center
          gradient.addColorStop(1, 'rgba(251, 146, 60, 0.8)') // Orange-red
          
          ctx.strokeStyle = gradient
          ctx.lineWidth = 3 + Math.sin(synapse.pulse) * 2
          ctx.shadowColor = 'rgba(251, 146, 60, 0.6)'
          ctx.shadowBlur = 10
        } else {
          // Inactive synapse - subtle connection
          ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)' // Dark brown
          ctx.lineWidth = 1
          ctx.shadowBlur = 0
        }

        ctx.beginPath()
        ctx.moveTo(fromNeuron.x, fromNeuron.y)
        ctx.lineTo(toNeuron.x, toNeuron.y)
        ctx.stroke()
      })

      // Draw neurons
      updatedNeurons.forEach((neuron, index) => {
        const mouseDistance = Math.sqrt(
          Math.pow(neuron.x - mouse.x, 2) + Math.pow(neuron.y - mouse.y, 2)
        )

        // Mouse influence
        const mouseInfluence = Math.max(0, 1 - mouseDistance / 120)
        const sizeMultiplier = 1 + mouseInfluence * 0.5

        // Neuron body
        const gradient = ctx.createRadialGradient(
          neuron.x, neuron.y, 0,
          neuron.x, neuron.y, neuron.size * sizeMultiplier * 2
        )
        
        if (mouseInfluence > 0.1) {
          // Mouse nearby - bright glow
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)') // White-hot center
          gradient.addColorStop(0.3, 'rgba(251, 146, 60, 0.8)') // Orange-red
          gradient.addColorStop(0.7, 'rgba(220, 38, 38, 0.4)') // Red
          gradient.addColorStop(1, 'rgba(139, 69, 19, 0.1)') // Dark brown
        } else {
          // Normal state
          gradient.addColorStop(0, `rgba(251, 146, 60, ${neuron.glow * 0.8})`)
          gradient.addColorStop(0.5, `rgba(220, 38, 38, ${neuron.glow * 0.4})`)
          gradient.addColorStop(1, `rgba(139, 69, 19, ${neuron.glow * 0.1})`)
        }

        ctx.fillStyle = gradient
        ctx.shadowColor = 'rgba(251, 146, 60, 0.6)'
        ctx.shadowBlur = mouseInfluence > 0.1 ? 20 : 5

        ctx.beginPath()
        ctx.arc(neuron.x, neuron.y, neuron.size * sizeMultiplier, 0, Math.PI * 2)
        ctx.fill()

        // Neuron center (bright dot)
        ctx.fillStyle = mouseInfluence > 0.1 
          ? 'rgba(255, 255, 255, 1)' 
          : `rgba(255, 255, 255, ${neuron.glow * 0.6})`
        ctx.shadowBlur = 0
        
        ctx.beginPath()
        ctx.arc(neuron.x, neuron.y, 2, 0, Math.PI * 2)
        ctx.fill()

        // Dendrites (branching extensions)
        const dendriteCount = 6
        for (let i = 0; i < dendriteCount; i++) {
          const angle = (i / dendriteCount) * Math.PI * 2 + time * 0.5
          const length = 15 + Math.sin(time * 2 + i) * 5
          const endX = neuron.x + Math.cos(angle) * length
          const endY = neuron.y + Math.sin(angle) * length

          ctx.strokeStyle = `rgba(139, 69, 19, ${neuron.glow * 0.3})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(neuron.x, neuron.y)
          ctx.lineTo(endX, endY)
          ctx.stroke()
        }
      })

      // Mouse cursor glow effect
      const cursorGlow = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, 80
      )
      cursorGlow.addColorStop(0, 'rgba(251, 146, 60, 0.1)')
      cursorGlow.addColorStop(0.5, 'rgba(251, 146, 60, 0.05)')
      cursorGlow.addColorStop(1, 'rgba(251, 146, 60, 0)')
      
      ctx.fillStyle = cursorGlow
      ctx.beginPath()
      ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI * 2)
      ctx.fill()

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [neurons, synapses])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  )
}

export default BrainAnimation
