
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';

export default function PerfilPage() {
  const user = useSelector((s: RootState) => s.auth?.user);
  const isAuthenticated = useSelector((s: RootState) => s.auth?.isAuthenticated);
  


  if (!isAuthenticated || !user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
          maxWidth: '28rem',
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            background: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <span style={{ fontSize: '2rem', color: '#dc2626' }}>⚠️</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
            Acesso Negado
          </h2>
          <p style={{ color: '#6b7280' }}>
            Você precisa estar autenticado para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

      return (
      <div style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #c7d2fe 100%)',
        overflowY: 'auto',
        padding: '2rem 1rem',
        boxSizing: 'border-box'
      }}>
                <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Header Principal */}
        <div style={{
          background: 'white',
          borderRadius: '1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          marginBottom: '2rem'
        }}>
                     <div style={{
             background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #4f46e5 100%)',
             padding: '2rem 1.5rem',
             color: 'white',
             textAlign: 'center'
           }}>
                         <div style={{
               width: '5rem',
               height: '5rem',
               background: 'rgba(255, 255, 255, 0.2)',
               borderRadius: '50%',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               margin: '0 auto 1rem',
               border: '3px solid rgba(255, 255, 255, 0.3)'
             }}>
               <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                 {user.name ? user.name[0].toUpperCase() : 'U'}
               </span>
             </div>
             <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
               {user.name}
             </h1>
             <p style={{ fontSize: '1.125rem', color: '#bfdbfe', marginBottom: '1rem' }}>
               {user.email}
             </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '9999px',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              👤 {user.role}
            </div>
          </div>
        </div>

                 {/* Grid de Informações */}
         <div style={{
           display: 'grid',
           gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
           gap: '1.5rem',
           marginBottom: '2rem'
         }}>
          {/* Informações Básicas */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            border: '1px solid #f3f4f6'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: '#dbeafe',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                👤
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                Informações Básicas
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '0.75rem',
                border: '2px solid #dbeafe'
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                    ID do Usuário
                  </p>
                  <p style={{ 
                    fontSize: '1.5rem', 
                    fontFamily: 'monospace', 
                    fontWeight: 'bold', 
                    color: '#1e40af',
                    background: '#eff6ff',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #dbeafe'
                  }}>
                    {user.id || 'N/A'}
                  </p>
                </div>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  background: '#dbeafe',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  🔢
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '0.75rem'
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Nome
                  </p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                    {user.name}
                  </p>
                </div>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  background: '#dcfce7',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  👤
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '0.75rem'
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Email
                  </p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                    {user.email}
                  </p>
                </div>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  background: '#f3e8ff',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  📧
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '0.75rem'
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Função
                  </p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
                    {user.role}
                  </p>
                </div>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  background: '#fed7aa',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  💼
                </div>
              </div>
            </div>
          </div>

          {/* Empresa Atual */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            border: '1px solid #f3f4f6'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: '#e0e7ff',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                🏢
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                Empresa Atual
              </h3>
            </div>
            
            <div style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%)',
              borderRadius: '0.75rem',
              border: '1px solid #c7d2fe'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#4338ca', marginBottom: '0.25rem' }}>
                    Empresa Selecionada
                  </p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e40af' }}>
                    {user.selectedCompany ? `ID: ${user.selectedCompany}` : 'Nenhuma empresa selecionada'}
                  </p>
                </div>
                {user.selectedCompany && (
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    background: '#e0e7ff',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    ✅
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Empresas Disponíveis */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            border: '1px solid #f3f4f6'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: '#dcfce7',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                🏢
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                Empresas Disponíveis
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {user.companies && user.companies.length > 0 ? (
                user.companies.map((company, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: '#f9fafb',
                    borderRadius: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        background: '#dbeafe',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#2563eb' }}>
                          {index + 1}
                        </span>
                      </div>
                      <span style={{ fontFamily: 'monospace', color: '#111827' }}>
                        {company}
                      </span>
                    </div>
                    {company === user.selectedCompany && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.75rem',
                        background: '#dcfce7',
                        color: '#166534',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        borderRadius: '9999px'
                      }}>
                        ✅ Atual
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '0.75rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📁</div>
                  <p style={{ color: '#6b7280' }}>Nenhuma empresa disponível</p>
                </div>
              )}
            </div>
          </div>

          {/* Informações Técnicas */}
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            border: '1px solid #f3f4f6'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                background: '#f3e8ff',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                ⚙️
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                Informações Técnicas
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '0.75rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Status de Autenticação
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '0.25rem'
                    }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.625rem',
                        background: isAuthenticated ? '#dcfce7' : '#fee2e2',
                        color: isAuthenticated ? '#166534' : '#dc2626',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        borderRadius: '9999px'
                      }}>
                        <div style={{
                          width: '0.5rem',
                          height: '0.5rem',
                          borderRadius: '50%',
                          background: isAuthenticated ? '#16a34a' : '#dc2626'
                        }}></div>
                        {isAuthenticated ? 'Autenticado' : 'Não Autenticado'}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: '#dcfce7',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    ✅
                  </div>
                </div>
              </div>
              
              <div style={{
                padding: '1rem',
                background: '#f9fafb',
                borderRadius: '0.75rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                      Tipo de ID
                    </p>
                    <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', fontFamily: 'monospace' }}>
                      {typeof user.id}
                    </p>
                  </div>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    background: '#dbeafe',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    📄
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

                 {/* Seção de Ações */}
         <div style={{
           background: 'white',
           borderRadius: '1.5rem',
           boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
           padding: '1.5rem',
           border: '1px solid #f3f4f6'
         }}>
           <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
              Ações Rápidas
            </h3>
            <p style={{ color: '#6b7280' }}>
              Gerencie e visualize suas informações de perfil
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <button 
              onClick={() => {
                const userInfo = {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  selectedCompany: user.selectedCompany,
                  companies: user.companies
                };
                console.log('Dados do usuário:', userInfo);
                alert('Dados do usuário copiados para o console!');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '1rem 1.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                fontWeight: '600',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }}
            >
              📋 Copiar para Console
            </button>
            
            <button 
              onClick={() => {
                const userInfo = {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  selectedCompany: user.selectedCompany,
                  companies: user.companies
                };
                navigator.clipboard.writeText(JSON.stringify(userInfo, null, 2));
                alert('Dados copiados para a área de transferência!');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '1rem 1.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                fontWeight: '600',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }}
            >
              📋 Copiar para Área de Transferência
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
