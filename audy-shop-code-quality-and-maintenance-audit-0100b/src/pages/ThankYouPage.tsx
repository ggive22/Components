import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

const ThankYouPage = () => {
  const [params] = useSearchParams();
  const orderNumber = params.get("n");

  useEffect(() => {
    document.title = "Merci pour votre commande — Audy Shop";
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="w-12 h-12 rounded-full bg-accent mx-auto mb-6 flex items-center justify-center">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-medium mb-3">Merci !</h1>
      <p className="text-muted-foreground mb-2 leading-relaxed">
        Audy vous contactera sous peu pour confirmer votre livraison.
      </p>
      {orderNumber && (
        <p className="text-sm text-muted-foreground mb-8">
          Numéro de commande : <span className="text-foreground">#{orderNumber}</span>
        </p>
      )}
      <Link
        to="/"
        className="inline-block text-sm border-b border-foreground pb-0.5"
      >
        Retour à la boutique
      </Link>
    </div>
  );
};

export default ThankYouPage;
