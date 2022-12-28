import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";

import ExampleForm from "./Form";
import ExampleBadges from "./Badges";
import ExampleTypography from "./Typography";
import ExampleListGroup from "./ListGroup";
import ExampleButtons from "./Buttons";
import ExampleToast from "./Toast";

function ExampleBootstrap() {
    return (
        <Container fluid>
            <Row className="g-2">
                <Col xs={12} md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Form</Card.Title>
                            <ExampleForm></ExampleForm>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} md={5}>
                    <Row className="g-2">
                        <Col lg="12">
                            <Card>
                                <Card.Body>
                                    <Card.Title>Buttons</Card.Title>
                                    <ExampleButtons></ExampleButtons>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg="12">
                            <Card>
                                <Card.Body>
                                    <Card.Title>Badges</Card.Title>
                                    <ExampleBadges></ExampleBadges>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>

                <Col md={3}></Col>
            </Row>
            <Row className="g-2">
                <Col xs={12} md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Typography</Card.Title>
                            <ExampleTypography></ExampleTypography>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} md={5}>
                    <Card>
                        <Card.Body>
                            <Card.Title>List Group</Card.Title>
                            <ExampleListGroup></ExampleListGroup>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg="12">
                    <Card>
                        <Card.Body>
                            <Card.Title>Toast</Card.Title>
                            <ExampleToast></ExampleToast>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default ExampleBootstrap;
