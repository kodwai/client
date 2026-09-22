import type { Metadata } from "next";
import { HomeRedirect } from "./home-redirect";

// The app root only redirects, so keep it out of the index and let
// www.kodwai.com own the brand queries. Links are still followed.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function Home() {
  return <HomeRedirect />;
}
