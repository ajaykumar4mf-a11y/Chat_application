import React from 'react';
import Sidebar from './Sidebar';
import MessageContainer from './MessageContainer';
import { useChat } from '../src/context/ChatContext';

const Home = () => {
  const { isMobileChatOpen } = useChat();

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-[#07090e] p-2 sm:p-4 md:p-5 overflow-hidden text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Background SVG Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Decorative Ambient Gradient Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse duration-1000" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Main Glassmorphic Chat Shell Container */}
      <div className="relative w-full max-w-7xl h-full flex flex-col min-h-0 p-[1px] rounded-2xl sm:rounded-3xl bg-gradient-to-b from-white/20 via-white/[0.06] to-transparent shadow-2xl shadow-black/80 overflow-hidden">
        <div className="relative w-full h-full min-h-0 bg-[#0c101b]/95 backdrop-blur-3xl rounded-[21px] sm:rounded-[23px] flex flex-row overflow-hidden border border-white/[0.05]">
          {/* Sidebar Pane */}
          <div
            className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full flex flex-col min-h-0 border-r border-white/[0.07] overflow-hidden ${
              isMobileChatOpen ? 'hidden md:flex' : 'flex'
            }`}
          >
            <Sidebar />
          </div>

          {/* Messages Main Pane */}
          <div
            className={`flex-1 h-full min-w-0 flex flex-col min-h-0 overflow-hidden ${
              !isMobileChatOpen ? 'hidden md:flex' : 'flex'
            }`}
          >
            <MessageContainer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;