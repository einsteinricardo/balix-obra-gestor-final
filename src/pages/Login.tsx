
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { backgroundLogin } from '@/assets';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [erroLogin, setErroLogin] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      // Redirect to dashboard on successful login
      navigate('/');
    } catch (error: any) {
      if (error.message && error.message.includes('Invalid login credentials')) {
        setErroLogin('Usuário ou senha inválidos');
      } else {
        setErroLogin('Erro ao fazer login. Tente novamente.');
      }
      
      // Keep Toast for standard generalized logging but use screen UI
      toast({
        title: 'Autenticação Recusada',
        description: 'Verifique suas credenciais de acesso.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Background image */}
      <img 
        src={backgroundLogin} 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      {/* Overlay for better form visibility */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      <div className="w-full max-w-md relative z-10">
        <Card className="border-border/50 bg-balix-primary/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-playfair text-balix-light">Entrar</CardTitle>
            <CardDescription className="text-balix-light/80">
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {erroLogin && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md text-center font-medium animate-in fade-in zoom-in duration-300">
                  {erroLogin}
                </div>
              )}
            
              <div className="space-y-2">
                <Label htmlFor="email" className="text-balix-light">Email</Label>
                <Input 
                  id="email"
                  type="email" 
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErroLogin('');
                  }}
                  placeholder="seu@email.com"
                  required
                  className="bg-balix-primary/50 border-border/50 text-balix-light placeholder:text-balix-light/60"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-balix-light">Senha</Label>
                  <Link to="/esqueci-senha" className="text-sm text-balix-accent hover:underline">
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErroLogin('');
                  }}
                  placeholder="********"
                  required
                  className="bg-balix-primary/50 border-border/50 text-balix-light placeholder:text-balix-light/60"
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              <Button 
                type="submit"
                disabled={loading}
                className="w-full bg-balix-accent hover:bg-balix-accent/90 text-white font-medium"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
              <div className="text-center text-sm text-balix-light/80">
                Não tem uma conta?{' '}
                <Link to="/register" className="text-balix-accent hover:underline font-medium">
                  Criar conta
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
