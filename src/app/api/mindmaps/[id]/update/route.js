import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongoose';
import MindMap from '@/app/models/MindMap';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const {
      nodeId,
      position,
      content,
      source,
      target,
      newNode,
      nodeType,
      deleteNodeId,
    } = await request.json();

    const mindMap = await MindMap.findById(id);
    if (!mindMap) {
      return NextResponse.json(
        { error: 'Mind map not found' },
        { status: 404 }
      );
    }

    // Handle new node creation
    if (newNode) {
      mindMap.nodes.push({
        id: newNode.id,
        content: newNode.content,
        parentId: newNode.parentId,
        position: newNode.position,
        nodeType: newNode.nodeType,
      });
    }
    // Handle node deletion
    else if (deleteNodeId) {
      mindMap.nodes = mindMap.nodes.filter(node => node.id !== deleteNodeId);
      // Also remove any edges connected to this node
      mindMap.edges =
        mindMap.edges?.filter(
          edge => edge.source !== deleteNodeId && edge.target !== deleteNodeId
        ) || [];
    }
    // Handle node position update
    else if (nodeId && position) {
      const nodeIndex = mindMap.nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) {
        return NextResponse.json({ error: 'Node not found' }, { status: 404 });
      }
      mindMap.nodes[nodeIndex].position = position;
    }
    // Handle node content update
    else if (nodeId && (content !== undefined || nodeType)) {
      const nodeIndex = mindMap.nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) {
        return NextResponse.json({ error: 'Node not found' }, { status: 404 });
      }
      if (content !== undefined) {
        mindMap.nodes[nodeIndex].content = content;
      }
      if (nodeType) {
        mindMap.nodes[nodeIndex].nodeType = nodeType;
      }
    }
    // Handle edge creation
    else if (source && target) {
      mindMap.edges = mindMap.edges || [];
      mindMap.edges.push({ source, target });
    } else {
      return NextResponse.json(
        { error: 'Invalid update parameters' },
        { status: 400 }
      );
    }

    await mindMap.save();
    return NextResponse.json({ success: true, mindMap });
  } catch (error) {
    console.error('Error updating mind map:', error);
    return NextResponse.json(
      { error: 'Failed to update mind map' },
      { status: 500 }
    );
  }
}
