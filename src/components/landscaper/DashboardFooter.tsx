import React from 'react'
import { Link } from 'react-router-dom'

export default function DashboardFooter() {
  return (
    <footer className="mt-8 p-6 bg-black border-t border-green-500 shadow-lg shadow-green-500/10">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-green-400 text-sm mb-3">
          © 2025 GreenScape Lux. All Rights Reserved.
        </p>
        
        <div className="flex flex-wrap justify-center items-center space-x-6 mb-3">
          <Link 
            to="/terms" 
            className="text-green-400 hover:text-green-300 transition-colors duration-200 text-sm hover:shadow-sm hover:shadow-green-400/50"
          >
            Terms of Service
          </Link>
          <Link 
            to="/privacy" 
            className="text-green-400 hover:text-green-300 transition-colors duration-200 text-sm hover:shadow-sm hover:shadow-green-400/50"
          >
            Privacy Policy
          </Link>
          <Link 
            to="/help" 
            className="text-green-400 hover:text-green-300 transition-colors duration-200 text-sm hover:shadow-sm hover:shadow-green-400/50"
          >
            Help Center
          </Link>
        </div>
        
        <p className="text-green-400/80 text-xs">
          Contact: 
          <a 
            href="mailto:support@greenscapelux.com" 
            className="text-green-400 hover:text-green-300 transition-colors duration-200 ml-1 hover:shadow-sm hover:shadow-green-400/50"
          >
            support@greenscapelux.com
          </a>
        </p>
      </div>
    </footer>
  )
}