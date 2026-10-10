import React from "react";
import A_nucleus from "physiology-mdx/part1/chapter1/A.mdx";

const Red = (props: any) => (
  <span style={{ color: "red", fontWeight: "bold" }}>{props.children}</span>
);

export default function PhysiologyMDXPage() {
  return (
    <div className="p-4">
      <A_nucleus components={{ Red }} />
    </div>
  );
}
