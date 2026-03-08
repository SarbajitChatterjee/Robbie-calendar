import { useState } from "react";
import { Sun, CalendarDays, Grid3X3, Inbox, Layers, Settings } from "lucide-react";
import { TabId } from "@/types";
import TodayView from "@/components/calendar/TodayView";
import WeekView from "@/components/calendar/WeekView";
import MonthView from "@/components/calendar/MonthView";
import InboxView from "@/components/inbox/InboxView";
import CalendarsView from "@/components/calendars/CalendarsView";
import SettingsView from "@/pages/Settings";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "today", label: "Today", icon: Sun },
  { id: "week", label: "Week", icon: CalendarDays },
  { id: "month", label: "Month", icon: Grid3X3 },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "calendars", label: "Calendars", icon: Layers },
];

export default function AppLayout() {
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop top nav */}
      <nav className="hidden md:flex items-center justify-between px-6 h-16 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--fuse-primary))] flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="font-bold text-lg text-foreground">Robbie</span>
        </div>
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setShowSettings(false); }}
                className={`flex items-center gap-2 px-4 h-10 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.id && !showSettings ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
          <button
            onClick={() => setShowSettings(true)}
            className={`flex items-center gap-2 px-4 h-10 rounded-full text-sm font-medium transition-colors ml-2 ${
              showSettings ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {showSettings ? (
          <SettingsView />
        ) : (
          <>
            {activeTab === "today" && <TodayView />}
            {activeTab === "week" && <WeekView />}
            {activeTab === "month" && <MonthView />}
            {activeTab === "inbox" && <InboxView />}
            {activeTab === "calendars" && <CalendarsView />}
          </>
        )}
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around z-40 pb-safe" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && !showSettings;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowSettings(false); }}
              className={`flex flex-col items-center justify-center w-full py-2 min-h-[var(--min-tap)] transition-colors ${
                isActive ? "text-[hsl(var(--fuse-primary))]" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
