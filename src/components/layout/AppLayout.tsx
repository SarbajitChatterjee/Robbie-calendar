/**
 * AppLayout — The main application shell.
 *
 * Renders:
 * - Desktop: horizontal top navigation bar with tab buttons
 * - Mobile: fixed bottom tab bar with icons
 * - Content area: switches between views based on activeTab state
 *
 * Also mounts the real-time email-detection popup and the Inbox tab badge.
 */

import { useState, useCallback } from "react";
import { Sun, CalendarDays, Grid3X3, Inbox, Layers, Settings } from "lucide-react";
import { TabId } from "@/types";
import TodayView from "@/components/calendar/TodayView";
import WeekView from "@/components/calendar/WeekView";
import MonthView from "@/components/calendar/MonthView";
import InboxView from "@/components/inbox/InboxView";
import CalendarsView from "@/components/calendars/CalendarsView";
import SettingsView from "@/pages/Settings";
import { useEventDetection } from "@/hooks/useEventDetection";
import { usePendingInbox } from "@/hooks/useEvents";
import EventDetectedPopup from "@/components/shared/EventDetectedPopup";

/** Tab configuration — order here determines render order in nav. */
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

  const { currentEvent, queueCount, acceptCurrent, dismissCurrent, snoozeAll } =
    useEventDetection();
  const { data: pendingEvents } = usePendingInbox();
  const pendingCount = pendingEvents?.length ?? 0;

  /** Navigate to a specific tab, dismissing Settings if open. */
  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    setShowSettings(false);
  }, []);

  /** Renders an icon with an optional pending-count badge (Inbox tab only). */
  const renderTabIcon = (
    tab: { id: TabId; icon: React.ElementType },
    iconClass: string,
  ) => {
    const Icon = tab.icon;
    const showBadge = tab.id === "inbox" && pendingCount > 0;
    return (
      <span className="relative inline-flex">
        <Icon className={iconClass} />
        {showBadge && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[hsl(var(--fuse-primary))] text-white text-[10px] font-semibold flex items-center justify-center leading-none">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Desktop Top Navigation ────────────────────────── */}
      <nav className="hidden md:flex items-center justify-between px-6 h-16 border-b border-border bg-card">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--fuse-primary))] flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="font-bold text-lg text-foreground">Robbie</span>
        </div>

        {/* Tab buttons + Settings */}
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 h-10 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.id && !showSettings ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {renderTabIcon(tab, "w-4 h-4")}
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

      {/* ── Content Area ──────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {showSettings ? (
          <SettingsView />
        ) : (
          <>
            {activeTab === "today" && <TodayView onTabChange={handleTabChange} />}
            {activeTab === "week" && <WeekView />}
            {activeTab === "month" && <MonthView />}
            {activeTab === "inbox" && <InboxView />}
            {activeTab === "calendars" && <CalendarsView />}
          </>
        )}
      </main>

      {/* ── Mobile Bottom Tab Bar ─────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around z-40 pb-safe" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id && !showSettings;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full py-2 min-h-[var(--min-tap)] transition-colors ${
                isActive ? "text-[hsl(var(--fuse-primary))]" : "text-muted-foreground"
              }`}
            >
              {renderTabIcon(tab, "w-5 h-5")}
              <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Real-time Event Detection Popup ──────────────── */}
      {currentEvent && (
        <EventDetectedPopup
          event={currentEvent}
          queueCount={queueCount}
          onAccept={acceptCurrent}
          onDismiss={dismissCurrent}
          onCheckLater={() => {
            snoozeAll();
            handleTabChange("inbox");
          }}
        />
      )}
    </div>
  );
}
