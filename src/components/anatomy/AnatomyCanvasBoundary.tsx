import React from "react";
interface Props {
  children: React.ReactNode;
  onRetry: () => void;
}
class AnatomyCanvasBoundary extends React.Component<
  Props,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="anatomy-empty" role="alert">
        <strong>3D表示を開始できませんでした。</strong>
        <p>WebGLが利用できるブラウザーで、再表示してください。</p>
        <button
          type="button"
          onClick={() => {
            this.props.onRetry();
            this.setState({ failed: false });
          }}
        >
          3Dを再表示
        </button>
      </div>
    );
  }
}
export default AnatomyCanvasBoundary;
