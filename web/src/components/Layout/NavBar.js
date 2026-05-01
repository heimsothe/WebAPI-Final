/*
- File: NavBar.js
- Author: Elijah Heimsoth
- Date: 05/01/2026
- Assignment: WebAPI-FinalProject
- Class: CSCI 3916

Description: Top-of-page chrome shown on every protected route. Brand
on the left, Dashboard / Sync / Settings links in the middle, and a
user-identity dropdown on the right whose only entry in Slice 2 is
"Log out". Subsequent slices may extend the dropdown; for now keep
it minimal.
 */

import { Container, Dropdown, Nav, Navbar } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/userSlice';

export default function NavBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.user.user);

  const identity = user?.display_name || user?.email || 'Account';

  const onLogout = () => {
    dispatch(logout());
    navigate('/signin', { replace: true });
  };

  return (
    <Navbar bg="light" expand="md" className="border-bottom">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>Package Tracker</Navbar.Brand>
        </LinkContainer>
        <Navbar.Toggle aria-controls="primary-nav" />
        <Navbar.Collapse id="primary-nav">
          <Nav className="me-auto">
            <LinkContainer to="/">
              <Nav.Link>Dashboard</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/sync">
              <Nav.Link>Sync</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/settings">
              <Nav.Link>Settings</Nav.Link>
            </LinkContainer>
          </Nav>
          <Dropdown align="end">
            <Dropdown.Toggle variant="outline-secondary" id="user-menu">
              {identity}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as="button" onClick={onLogout}>
                Log out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
