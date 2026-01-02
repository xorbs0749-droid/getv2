import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "@/pages/Home";
import Player from "@/pages/Player";
import Board from "@/pages/Board";
import Community from "@/pages/Community";
import PostDetail from "@/pages/PostDetail";
import PostEdit from "@/pages/PostEdit";
import SavedTracks from "@/pages/SavedTracks";
import StoragePacks from "@/pages/StoragePacks";
import PaymentSuccess from "@/pages/PaymentSuccess";
import Admin from "@/pages/Admin";
import Landing from "@/pages/Landing";
import AuthGuard from "@/components/AuthGuard";

function Router() {
  return (
    <Switch>
      {/* Public route: Landing page */}
      <Route path="/" component={Landing} />
      
      {/* Protected routes: Require authentication */}
      <Route path="/home">
        <AuthGuard>
          <Home />
        </AuthGuard>
      </Route>
      <Route path="/board">
        <AuthGuard>
          <Board />
        </AuthGuard>
      </Route>
      <Route path="/saved">
        <AuthGuard>
          <SavedTracks />
        </AuthGuard>
      </Route>
      <Route path="/storage-packs">
        <AuthGuard>
          <StoragePacks />
        </AuthGuard>
      </Route>
      <Route path="/payment/success">
        <AuthGuard>
          <PaymentSuccess />
        </AuthGuard>
      </Route>
      <Route path="/admin">
        <AuthGuard>
          <Admin />
        </AuthGuard>
      </Route>
      <Route path="/player">
        <AuthGuard>
          <Player />
        </AuthGuard>
      </Route>
      <Route path="/community">
        <AuthGuard>
          <Community />
        </AuthGuard>
      </Route>
      <Route path="/community/post/:id">
        <AuthGuard>
          <PostDetail />
        </AuthGuard>
      </Route>
      <Route path="/community/post/:id/edit">
        <AuthGuard>
          <PostEdit />
        </AuthGuard>
      </Route>
      
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
