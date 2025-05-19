import {useEffect, useState} from 'react';
import IpAddressPage from './component/IpAddressPage.jsx';
import Message from "./component/Message.jsx";

function App() {
  const [ipAddress, setIpAddress] = useState(null);

    useEffect(() => {
        fetch("https://api.ipify.org?format=json", { method: "GET" })
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
            {ipAddress ? <Message ipAddress={ipAddress} /> : <IpAddressPage setIpAddress={setIpAddress} />}
        </div>
    );
}

export default App;