"use client";

import React, { useState, useEffect } from "react";
import RoyalSplitApp from "@/components/RoyalSplitApp";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  const [showDashboard, setShowDashboard] = useState(false);

  // Check if we're loading a specific group from the URL
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      setShowDashboard(true);
    }
  }, []);

  if (!showDashboard) {
    return <LandingPage onStart={() => setShowDashboard(true)} />;
  }

  return <RoyalSplitApp />;
}
