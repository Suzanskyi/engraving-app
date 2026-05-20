import React from 'react';
import styled from 'styled-components';
import { Sparkles, FileText } from 'lucide-react';

const HeaderContainer = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(12, 18, 32, 0.42);
  backdrop-filter: blur(24px) saturate(170%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.16);
  padding: 0.75rem 2rem;
  width: 100%;

  @media (max-width: 760px) {
    padding: 0.75rem 1rem;
  }
`;

const HeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0;
`;

const LogoIcon = styled.div`
  background: linear-gradient(135deg, #ffd58f, #33d6c5 48%, #ff5c75);
  border-radius: 10px;
  padding: 0.36rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(255, 184, 77, 0.25);
`;

const Nav = styled.nav`
  display: flex;
  gap: 1rem;
  align-items: center;

  @media (max-width: 760px) {
    gap: 0.5rem;
  }
`;

const NavLink = styled.a`
  color: rgba(255, 255, 255, 0.78);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: color 0.3s ease, background 0.3s ease;
  cursor: pointer;
  padding: 0.4rem 0.55rem;
  border-radius: 999px;
  
  &:hover {
    color: white;
    background: rgba(255,255,255,0.08);
  }

  @media (max-width: 760px) {
    display: none;
  }
`;

const RequestsButton = styled.button`
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.32);
  padding: 0.58rem 0.9rem;
  border-radius: 999px;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  backdrop-filter: blur(16px);
  transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.24);
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 12px 28px rgba(0,0,0,0.16);
  }
`;

const Header = ({ onNavigateToRequests }) => {
  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo>
          <LogoIcon>
            <Sparkles size={20} color="#333" />
          </LogoIcon>
          EngraveCraft
        </Logo>
        <Nav>
          <NavLink href="#home">Home</NavLink>
          <NavLink href="#services">Services</NavLink>
          <NavLink href="#portfolio">Portfolio</NavLink>
          <NavLink href="#contact">Contact</NavLink>
          {onNavigateToRequests && (
            <RequestsButton onClick={onNavigateToRequests}>
              <FileText size={14} />
              My Requests
            </RequestsButton>
          )}
        </Nav>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
