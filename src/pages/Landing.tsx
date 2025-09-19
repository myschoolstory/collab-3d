import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { ArrowRight, Box, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router";

export default function Landing() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight">3D Studio</span>
          </div>
          <Button
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
            className="font-medium"
          >
            {isAuthenticated ? "Dashboard" : "Get Started"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-32">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-5xl font-bold tracking-tight mb-8">
              Collaborative 3D Modeling
              <br />
              <span className="text-muted-foreground">in Your Browser</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Professional 3D modeling with advanced PBR texturing, real-time collaboration, 
            and multi-tenant workspace management. Create, share, and iterate together.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              className="font-medium px-8"
            >
              {isAuthenticated ? "Open Dashboard" : "Start Creating"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 bg-muted/20">
        <div className="max-w-6xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Professional-grade 3D modeling tools with collaborative features 
              designed for modern teams.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Box className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">Advanced Modeling</h3>
              <p className="text-muted-foreground leading-relaxed">
                Professional 3D modeling tools with mesh editing, sculpting, 
                and procedural generation capabilities.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">PBR Materials</h3>
              <p className="text-muted-foreground leading-relaxed">
                Physically-based rendering with advanced material editor, 
                texture painting, and real-time preview.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">Real-time Collaboration</h3>
              <p className="text-muted-foreground leading-relaxed">
                Work together in real-time with live cursors, shared workspaces, 
                and version control for teams.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="text-3xl font-bold tracking-tight mb-6">
              Ready to Start Creating?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of creators building the future of 3D content 
              with our collaborative platform.
            </p>
            <Button
              size="lg"
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}
              className="font-medium px-8"
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <p className="text-sm text-muted-foreground">
            Built with{" "}
            <a
              href="https://vly.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary transition-colors"
            >
              vly.ai
            </a>
          </p>
        </div>
      </footer>
    </motion.div>
  );
}