import type { DescriptorEdge } from "@/content/artwork-graph";

export function ConnectionEvidence({ label, evidence }: { label: string; evidence: DescriptorEdge["evidence"] }) {
  return <div className="connection-source-excerpt">
    <p><strong>{label}</strong> — {evidence.field === "alt" ? "Image description (alt)" : "Caption (description)"}: matched <q>{evidence.matched}</q>.</p>
    <blockquote>{evidence.quote}</blockquote>
  </div>;
}
