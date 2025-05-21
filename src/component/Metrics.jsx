import Avatar from 'react-avatar';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';

function Metrics({ message }) {

    Metrics.propTypes = {
        message: PropTypes.object.isRequired
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', margin: '5px 0' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                <Avatar name={message.type} size="35" />
                <h4 style={{color: 'green'}}> {new Date(message.timeStamp).toLocaleDateString()}:{new Date(message.timeStamp).toLocaleTimeString()} </h4>
                <h4>{message.ipAddress}</h4> : <h4 style={{color: message.cpuUtilInPercent <= 60 ? 'lime' : 'orangered'}}>{message.cpuUtilInPercent}%</h4>
            </Box>
        </Box>
    );
}

export default Metrics;