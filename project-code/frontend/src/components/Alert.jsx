import {createContext, useState} from "react";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

/*
    Alerts & Alert context.
    A prettier way of giving pop-ups to the user that does not rely on built in browser functionality.
    This means:
        - User can't stop them popping up
        - It's prettier
        - more consistently styled
    How to use:

    // use hook
    // Must be at top-level, not in loops/if statements/render statements
    const alertContext = useContext(AlertContext);

    alertContext(title, message);

 */
export const Alert = ({title = "", content = "", handleClose = null, isVisible = false}) => {
    return (
        <Modal show={isVisible} onHide={handleClose} centered>
            <Modal.Header closeButton style={{backgroundColor: '#E2E2E2'}}>
                <Modal.Title style={{color: '#2978A0'}}>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{backgroundColor: '#F9F9F9', color: '#333'}}>{content}</Modal.Body>
            <Modal.Footer style={{backgroundColor: '#E2E2E2'}}>
                <Button variant="primary" onClick={handleClose}
                        style={{backgroundColor: '#2978A0', borderColor: '#2978A0'}}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    )
};

export const AlertContext = createContext((title, message, cb) => {
});

export const AlertHandler = ({children}) => {
    const [alertState, setAlertState] = useState({});

    function setAlert(title, message, cb) {
        setAlertState({
            title,
            message,
            callback: cb,
            visible: true
        });
    }

    function handleClose() {
        const cb = alertState.callback;
        setAlertState({visible: false});

        if (cb) cb();
    }

    return (
        <>
            <Alert title={alertState.title} content={alertState.message} handleClose={handleClose}
                   isVisible={alertState.visible}/>
            <AlertContext.Provider value={setAlert}>
                {children}
            </AlertContext.Provider>
        </>
    );
};

export default AlertHandler;
