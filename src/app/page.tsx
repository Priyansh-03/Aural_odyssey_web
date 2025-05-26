
"use client";

import React, { useState, useEffect } from 'react';
import { StorytellerSection } from "@/components/storyteller-section";
import { ChatbotSection } from "@/components/chatbot-section";
import { BookAnalysisSection } from "@/components/book-analysis-section";
import { SettingsSection } from "@/components/settings-section"; // Import the new SettingsSection
import { MessageSquareText, BookOpenCheck, Play, Settings as SettingsIcon } from "lucide-react";
import { cn } from '@/lib/utils';

type Section = 'conversational-ai' | 'book-analysis' | 'storyteller' | 'settings';

const SidebarNavItem = ({
  icon: Icon,
  title,
  subtitle,
  isActive,
  onClick
} : {
  icon: React.ElementType,
  title: string,
  subtitle: string,
  isActive: boolean,
  onClick: () => void
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-colors duration-200 ease-in-out hover-lift",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-lg"
          : "text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className={cn(
        "h-6 w-6 shrink-0 transition-colors",
        isActive ? "text-primary" : "text-sidebar-foreground/70 group-hover:text-primary"
        )}
      />
      <div className="overflow-hidden">
        <p className={cn(
          "font-semibold text-sm truncate transition-colors group-hover:text-sidebar-accent-foreground",
           isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground"
           )}>{title}</p>
        <p className={cn(
          "text-xs truncate transition-colors group-hover:text-sidebar-accent-foreground/80",
          isActive ? "text-sidebar-accent-foreground/80" : "text-sidebar-foreground/60"
          )}>{subtitle}</p>
      </div>
    </button>
  );
};

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<Section>('conversational-ai');
  const [date, setDate] = useState<Date | null>(null);

  useEffect(() => {
    setDate(new Date());
  }, []);


  const renderSection = () => {
    switch (activeSection) {
      case 'conversational-ai':
        return <ChatbotSection />;
      case 'book-analysis':
        return <BookAnalysisSection />;
      case 'storyteller':
        return <StorytellerSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <ChatbotSection />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground antialiased overflow-hidden">
      {/* Sidebar */}
      <nav className="w-72 bg-sidebar p-4 flex flex-col space-y-6 border-r border-sidebar-border shadow-2xl shrink-0">
        {/* Logo and App Name */}
        <div className="flex items-center space-x-3 p-2 mb-4">
          <img
            className="h-12 w-12 text-primary shrink-0 rounded-full border-2 border-primary/50 p-1"
            src="/aural-odyssey-logo.png"
            alt="Aural Odyssey App Logo"
            data-ai-hint="logo appicon headphones"
          />
          <div>
            <h1 className="text-2xl font-serif font-bold text-gradient">Aural Odyssey</h1>
            <p className="text-xs text-sidebar-foreground/70">AI-Powered Reading</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col space-y-2">
          <SidebarNavItem
            icon={MessageSquareText}
            title="Conversational AI"
            subtitle="Chat with AI assistant"
            isActive={activeSection === 'conversational-ai'}
            onClick={() => setActiveSection('conversational-ai')}
          />
          <SidebarNavItem
            icon={BookOpenCheck}
            title="Book Analysis"
            subtitle="Question your books"
            isActive={activeSection === 'book-analysis'}
            onClick={() => setActiveSection('book-analysis')}
          />
          <SidebarNavItem
            icon={Play}
            title="Storyteller"
            subtitle="Audio narration"
            isActive={activeSection === 'storyteller'}
            onClick={() => setActiveSection('storyteller')}
          />
          {/* Settings Navigation Item */}
          <SidebarNavItem
            icon={SettingsIcon}
            title="Settings"
            subtitle="App preferences"
            isActive={activeSection === 'settings'}
            onClick={() => setActiveSection('settings')}
          />
        </div>

        <div className="mt-auto p-2">
            <p className="text-xs text-center text-sidebar-foreground/50">
                &copy; {date ? date.getFullYear() : '...'} Aural Odyssey.
            </p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
        {renderSection()}
      </main>
    </div>
  );
}
