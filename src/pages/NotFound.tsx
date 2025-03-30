
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HomeIcon } from "lucide-react";
import PageLayout from "@/components/PageLayout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="relative">
          <div className="text-9xl font-bold text-fundhub-blue/10">404</div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-fundhub-navy">
            Page not found
          </div>
        </div>
        
        <p className="text-xl text-muted-foreground mt-6 max-w-md">
          We couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        
        <Button className="mt-8 bg-fundhub-blue hover:bg-fundhub-blue/90" size="lg" asChild>
          <Link to="/">
            <HomeIcon className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </PageLayout>
  );
};

export default NotFound;
