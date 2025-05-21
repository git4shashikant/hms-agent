import {useEffect, useState} from 'react';
import Message from "./component/Message.jsx";
import { IP_URL } from "./Constants.jsx";

function App() {
  const [ipAddress, setIpAddress] = useState(null);

    useEffect(() => {
        fetch(IP_URL, { method: "GET" })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('API request failed to fetch result for page');
                }
            }).then(data => {
            setIpAddress(data.ip);
        }).catch(error => {
            console.error(error);
        });
    });

    return (
        <div>
            <Message ipAddress={ipAddress} />
        </div>
    );
}

export default App;