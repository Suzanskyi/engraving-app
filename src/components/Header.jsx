import React from 'react';
import styled from 'styled-components';
import { Sparkles, FileText } from 'lucide-react';

const HeaderContainer = styled.header`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.5rem 2rem;
  width: 100%;
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
  gap: 0.5rem;
  color: white;
  font-size: 1.2rem;
  font-weight: 700;
`;

const LogoIcon = styled.div`
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  border-radius: 8px;
  padding: 0.3rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Nav = styled.nav`
  display: flex;
  gap: 1.5rem;
  align-items: center;
`;

const NavLink = styled.a`
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: color 0.3s ease;
  cursor: pointer;
  
  &:hover {
    color: white;
  }
`;

const RequestsButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
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
