import React, { Suspense } from "react";
import { useGLTF } from "@react-three/drei";
interface Props {
  id: string;
  url: string;
  attempt: number;
  onFailed: (id: string) => void;
  children: React.ReactNode;
}
class ModelBoundary extends React.Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailed(this.props.id);
  }
  componentDidUpdate(previous: Props) {
    if (previous.attempt !== this.props.attempt && this.state.failed) {
      useGLTF.clear(this.props.url);
      this.setState({ failed: false });
    }
  }
  render() {
    return this.state.failed ? null : (
      <Suspense fallback={null}>{this.props.children}</Suspense>
    );
  }
}
export default ModelBoundary;
