// frontend/src/config.js
// const LOCAL_API_BASE_URL = 'http://localhost/vamanan/api';
// const PRODUCTION_API_BASE_URL = 'https://vamananenterprisesv.com/api';

// const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
//   isLocalHost ? LOCAL_API_BASE_URL : PRODUCTION_API_BASE_URL
// );

// Local development → XAMPP Apache + local MySQL Workbench database (makkal_gold)
// const API_BASE_URL = 'http://localhost/Vamanan1/api';

// Production server (uncomment when deploying):
const API_BASE_URL = 'https://vamananenterprisesv.com/api';

export default API_BASE_URL;