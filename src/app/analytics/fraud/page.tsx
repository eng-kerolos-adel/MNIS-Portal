import { redirect } from "next/navigation";

export default function FraudRedirectPage() {
  redirect("/analytics/fraud-detection");
}
