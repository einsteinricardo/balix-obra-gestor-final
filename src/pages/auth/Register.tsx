
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { backgroundLogin } from '@/assets';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Erro de validação',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Verifique seu email para confirmar a conta.',
      });
      
      // Redirect to login page
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
            <CardTitle className="text-2xl font-playfair text-balix-light">Criar Conta</CardTitle>
            <CardDescription className="text-balix-light/80">
              Preencha os dados para registrar-se no sistema
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-balix-light">Nome Completo</Label>
                <Input 
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome completo"
                  required
                  className="bg-balix-primary/50 border-border/50 text-balix-light placeholder:text-balix-light/60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-balix-light">Email</Label>
                <Input 
                  id="email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="bg-balix-primary/50 border-border/50 text-balix-light placeholder:text-balix-light/60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-balix-light">Senha</Label>
                <Input 
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  required
                  minLength={6}
                  className="bg-balix-primary/50 border-border/50 text-balix-light placeholder:text-balix-light/60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-balix-light">Confirmar Senha</Label>
                <Input 
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  required
                  minLength={6}
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
                {loading ? 'Criando conta...' : 'Cadastrar'}
              </Button>
              <div className="text-center text-sm text-balix-light/80">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-balix-accent hover:underline font-medium">
                  Faça login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
