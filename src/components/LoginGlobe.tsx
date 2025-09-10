import React from 'react';
// import { Globe } from 'some-fast-globe-lib';
// Replace with a realistic globe library
import Globe from 'react-globe.gl';

const LoginGlobe = () => {
    // Slow rotation speed
    const globeRef = React.useRef<any>();

    React.useEffect(() => {
        if (globeRef.current) {
            globeRef.current.controls().autoRotate = true;
            globeRef.current.controls().autoRotateSpeed = 0.2; // Slow speed
        }
    }, []);

    return (
        <div style={{ width: '400px', height: '400px' }}>
            <Globe
                ref={globeRef}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                backgroundColor="rgba(0,0,0,0)"
            />
        </div>
    );
};

export default LoginGlobe;
