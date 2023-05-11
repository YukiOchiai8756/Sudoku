import {render} from '@testing-library/react';
import App from '../App';

test('Renders and 1+1=2, placeholder test.', () => {
    render(<App/>);
    expect(1 + 1).toBe(2);
});
