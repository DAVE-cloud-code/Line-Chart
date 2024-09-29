import React from 'react';
import { useLocation } from 'react-router-dom'; // To access the state passed from TemperatureChart

const PastDataPage = () => {
    const location = useLocation();
    const { labels, temperatureData } = location.state || { labels: [], temperatureData: [] };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-center text-2xl font-bold mb-4">
                Past Temperature Data
            </h1>
            <ul className="bg-white p-6 shadow-lg rounded-lg">
                {labels.length > 0 && temperatureData.length > 0 ? (
                    labels.map((date, index) => (
                        <li key={date} className="mb-2">
                            <span className="font-bold">Date: </span>{date} - <span className="font-bold">Temperature: </span>{temperatureData[index]}°C
                        </li>
                    ))
                ) : (
                    <p>No data available</p>
                )}
            </ul>
        </div>
    );
};

export default PastDataPage;