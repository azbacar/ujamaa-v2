import { Navigate, useParams, useLocation } from "react-router-dom";

/**
 * Deep-links courts pour notifications push, SMS, partages externes.
 * Mapping :
 *   /p/:id    → /prix/:id
 *   /e/:id    → /evenements/:id
 *   /ao/:id   → /appels-offres/:id
 *   /s/:id    → /services/:id
 *   /a/:id    → /annonces/:id
 *   /i/:id    → /investissement/:id
 *   /f/:id    → /freelance/:id
 *
 * Usage : ujamaan.com/p/abc123 (court, partageable, idéal SMS/notif)
 */
const targets: Record<string, string> = {
  p: "/prix",
  e: "/evenements",
  ao: "/appels-offres",
  s: "/services",
  a: "/annonces",
  i: "/investissement",
  f: "/freelance",
};

interface Props {
  prefix: keyof typeof targets | string;
}

const DeepLinkRedirect = ({ prefix }: Props) => {
  const { id } = useParams<{ id: string }>();
  const { search } = useLocation();
  const target = targets[prefix];
  if (!target || !id) return <Navigate to="/" replace />;
  return <Navigate to={`${target}/${id}${search}`} replace />;
};

export default DeepLinkRedirect;
