// client/src/components/DashSidebar.jsx
import { Sidebar } from 'flowbite-react';
import {
  HiUser,
  HiArrowSmRight,
  HiDocumentText,
  HiOutlineUserGroup,
  HiAnnotation,
  HiChartPie,
  HiPuzzle, // NEW: Import puzzle icon for quizzes
  HiCollection,
} from 'react-icons/hi';
import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signoutSuccess } from '../redux/user/userSlice';

// Define sidebar links in a configuration array
const sidebarLinks = [
  { tab: 'dash', label: 'Dashboard', icon: HiChartPie, adminOnly: true },
  { tab: 'posts', label: 'Posts', icon: HiDocumentText, adminOnly: true },
  { tab: 'users', label: 'Users', icon: HiOutlineUserGroup, adminOnly: true },
  { tab: 'comments', label: 'Comments', icon: HiAnnotation, adminOnly: true },
  { tab: 'tutorials', label: 'Tutorials', icon: HiDocumentText, adminOnly: true },
  { tab: 'quizzes', label: 'Quizzes', icon: HiPuzzle, adminOnly: true }, // NEW: Add Quizzes link
  { tab: 'problems', label: 'Problems', icon: HiPuzzle, adminOnly: true },
  { tab: 'content', label: 'Content', icon: HiCollection, adminOnly: true },
];

export default function DashSidebar() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const [tab, setTab] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) {
      setTab(tabFromUrl);
    }
  }, [location.search]);

  const handleSignout = useCallback(async () => {
    try {
      await fetch('/api/user/signout', { method: 'POST' });
      dispatch(signoutSuccess());
    } catch (error) {
      console.log(error.message);
    }
  }, [dispatch]);

  return (
      <Sidebar className='w-full md:w-56'>
        <Sidebar.Items>
          <Sidebar.ItemGroup className='flex flex-col gap-1'>
            {/* Profile link - handled separately due to its dynamic label */}
            <Link to='/dashboard?tab=profile'>
              <Sidebar.Item
                  active={tab === 'profile'}
                  icon={HiUser}
                  label={currentUser.isAdmin ? 'Admin' : 'User'}
                  labelColor='dark'
                  as='div'
              >
                Profile
              </Sidebar.Item>
            </Link>

            {/* Render links dynamically from the configuration array */}
            {sidebarLinks
                .filter(link => currentUser.isAdmin || !link.adminOnly)
                .map(link => (
                    <Link to={`/dashboard?tab=${link.tab}`} key={link.tab}>
                      <Sidebar.Item
                          active={tab === link.tab || (link.tab === 'dash' && !tab)}
                          icon={link.icon}
                          as='div'
                      >
                        {link.label}
                      </Sidebar.Item>
                    </Link>
                ))}

            {/* Sign Out button */}
            <Sidebar.Item
                icon={HiArrowSmRight}
                className='cursor-pointer'
                onClick={handleSignout}
            >
              Sign Out
            </Sidebar.Item>
          </Sidebar.ItemGroup>
        </Sidebar.Items>
      </Sidebar>
  );
}