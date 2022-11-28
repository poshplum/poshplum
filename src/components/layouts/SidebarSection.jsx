import Layout from "../layout";
import { PortalProvider } from "../PortalProvider";

// const BodyPortal = PortalProvider({
//     name: "SidebarSection-Body",
// });
const Title = Layout.namedSlot("Title");
const Body = Layout.defaultSlot("Body");

export class SidebarSection extends Layout {
    static Title = Title;
    static slots = { Title, Body };
    render() {
        const { title } = this.props;
        const { Title = title, Body } = this.slots;
        return (
            <ul className="nav flex-column">
                <h6 className="px-3 mt-4 mb-1 text-muted">
                    <small className="text-uppercase text-small">{Title}</small>
                </h6>

                {Body}
            </ul>
        );
    }
}
