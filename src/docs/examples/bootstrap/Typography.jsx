import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

function ExampleTypography() {
    return (
        <>
            <p class="h1">h1. Bootstrap heading</p>
            <p class="h2">h2. Bootstrap heading</p>
            <p class="h3">h3. Bootstrap heading</p>
            <p class="h4">h4. Bootstrap heading</p>
            <p class="h5">h5. Bootstrap heading</p>
            <p class="h6">h6. Bootstrap heading</p>

            <hr></hr>

            <p>
                You can use the mark tag to <mark>highlight</mark> text.
            </p>
            <p>
                <del>
                    This line of text is meant to be treated as deleted text.
                </del>
            </p>
            <p>
                <s>
                    This line of text is meant to be treated as no longer
                    accurate.
                </s>
            </p>
            <p>
                <ins>
                    This line of text is meant to be treated as an addition to
                    the document.
                </ins>
            </p>
            <p>
                <u>This line of text will render as underlined.</u>
            </p>
            <p>
                <small>
                    This line of text is meant to be treated as fine print.
                </small>
            </p>
            <p>
                <strong>This line rendered as bold text.</strong>
            </p>
            <p>
                <em>This line rendered as italicized text.</em>
            </p>
        </>
    );
}

export default ExampleTypography;
