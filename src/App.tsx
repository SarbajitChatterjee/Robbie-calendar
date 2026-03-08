/**
 * App.tsx — Root application component.
 *
 * Sets up the provider stack in the correct order:
 * 1. QueryClientProvider — TanStack Query cache for all data fetching
 * 2. TooltipProvider — Required by shadcn/ui tooltip components
 * 3. Sonner — Toast notification outlet (app-wide)
 * 4. BrowserRouter — Client-side routing
 *
 * All custom routes must be added ABOVE the catch-all "*" route.
 */

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
