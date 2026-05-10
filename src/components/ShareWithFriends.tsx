'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function ShareWithFriends() {
  const [showQRCode, setShowQRCode] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'qwikBite',
          text: 'Order faster and skip the queue with qwikBite! Join now.',
          url: window.location.href,
        })
      } catch (error) {
        console.log('Sharing failed', error)
      }
    } else {
      // Fallback for browsers that Don&apos;t support Web Share API
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      } catch (error) {
        console.log('Failed to copy link', error)
        // Fallback for browsers that Don&apos;t support Clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = window.location.href
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert('Link copied to clipboard!')
      }
    }
  }

  return (
    <section className="relative w-full bg-gradient-to-br from-amber-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 overflow-hidden transition-colors duration-300 py-16 md:py-20">
      <div className="absolute inset-0 z-0 opacity-50 dark:opacity-20">
        <span style={{ animationDelay: '0s' }} className="absolute top-1/4 left-1/4 text-5xl animate-float">🍔</span>
        <span style={{ animationDelay: '2s' }} className="absolute top-1/2 left-1/3 text-4xl animate-float">🍕</span>
        <span style={{ animationDelay: '4s' }} className="absolute bottom-1/4 right-1/4 text-6xl animate-float">☕</span>
        <span style={{ animationDelay: '1s' }} className="absolute bottom-1/3 left-2/3 text-5xl animate-float">🥪</span>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex flex-row items-center justify-between gap-8 md:gap-12">
          {/* Left side - Text and Buttons */}
          <div className="w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Share with your Friends
            </h2>
            <div className="text-left">
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg">
                Love our food? Share your experience with friends and get them to join the qwikBite family!
              </p>
              <div className="flex flex-row gap-4">
                <button
                  onClick={handleShare}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  Share App
                </button>
                <button
                  onClick={() => setShowQRCode(!showQRCode)}
                  className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all duration-300 flex items-center justify-center gap-2 group shadow-sm hover:shadow"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z" clipRule="evenodd" />
                  </svg>
                  {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
                </button>
              </div>
            </div>
          </div>

          {/* Right side - Image */}
          <div className="w-1/2">
            <div className="relative group w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-all duration-300 group-hover:duration-500"></div>
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBTUnYyYidlfkxgZc66O-14pQBtVABvGy_NrmisyZD2Dw1Fidfb2Bp64dm4BhDfc5vaarcrdjwJe4JDQNZle3rq6cuqXbREaodCN5ZHk5DJDZG5CaE-L8YHsmkItp0xF-KT9-uS2u2jFC72YVpoKx-9h3ILw_1LGsyWLZ0tr97ronPx1WsqAhn4J9zCE8Aml7M8mEvtMJjr_mChadZkZYKYW-Anjne9yORY1_eS4tb65uN6l_SifJQWUa66Qmm_VhTY6-rl4SxmQ"
                alt="A group of friends sharing a meal and laughing together"
                width={450}
                height={300}
                className="w-full h-auto rounded-xl shadow-xl relative z-10 transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
