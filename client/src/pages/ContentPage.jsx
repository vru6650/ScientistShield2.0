import { useParams } from 'react-router-dom';
import PageView from '../components/PageView.jsx';

const ContentPage = () => {
    const { slug } = useParams();
    return <PageView slug={slug} />;
};

export default ContentPage;
