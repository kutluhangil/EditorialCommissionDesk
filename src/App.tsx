import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router";
import StudioCommandPalette from "@/components/StudioCommandPalette";

const Home = lazy(() => import("./pages/Home"));
const CaseStudyPage = lazy(() => import("./pages/CaseStudyPage"));
const ArtistsPage = lazy(() => import("./pages/ArtistsPage"));
const EditionsPage = lazy(() => import("./pages/EditionsPage"));
const LicensingPage = lazy(() => import("./pages/LicensingPage"));
const SpecsPage = lazy(() => import("./pages/SpecsPage"));
const ColophonPage = lazy(() => import("./pages/ColophonPage"));
const ReviewRoomPage = lazy(() => import("./pages/ReviewRoomPage"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RouteLoadingFallback() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundColor: "var(--studio-canvas)",
        color: "var(--studio-ink)",
      }}
    >
      <div className="border-2 border-black bg-white text-black px-8 py-6 flex items-center gap-4 shadow-lg">
        <span
          className="w-3 h-3 animate-pulse inline-block"
          style={{ backgroundColor: "var(--studio-red)" }}
        />
        <span className="text-xs font-mono uppercase tracking-[0.2em]">
          Loading Studio Plate...
        </span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <StudioCommandPalette />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work/:slug" element={<CaseStudyPage />} />
          <Route path="/artists" element={<ArtistsPage />} />
          <Route path="/editions" element={<EditionsPage />} />
          <Route path="/licensing" element={<LicensingPage />} />
          <Route path="/specs" element={<SpecsPage />} />
          <Route path="/colophon" element={<ColophonPage />} />
          <Route path="/review/:code" element={<ReviewRoomPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
