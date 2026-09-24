import {
  ArcElement, BarController, BarElement, CategoryScale, Chart as ChartJS, DoughnutController,
  Legend, LinearScale, Tooltip,
} from 'chart.js';

ChartJS.register(ArcElement, BarController, BarElement, CategoryScale, DoughnutController, Legend, LinearScale, Tooltip);

export { ChartJS };
