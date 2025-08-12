declare module "react-treebeard" {
    import * as React from "react";
  
    interface TreeNode {
      name: string;
      toggled?: boolean;
      children?: TreeNode[];
    }
  
    interface TreebeardProps {
      data: TreeNode;
      onToggle: (node: TreeNode, toggled: boolean) => void;
      decorators?: any;
      style?: any;
    }
  
    export class Treebeard extends React.Component<TreebeardProps> {}
    export const decorators: any;
  }
  