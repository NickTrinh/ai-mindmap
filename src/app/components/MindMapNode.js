import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

function MindMapNode({ id, data }) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    // Update node content in the database
    fetch(`/api/mindmaps/${data.mindMapId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId: id, content: label }),
    });
  }, [id, label, data.mindMapId]);

  return (
    <>
      {isEditing ? (
        <input
          autoFocus
          defaultValue={label}
          onBlur={handleBlur}
          onChange={e => setLabel(e.target.value)}
        />
      ) : (
        <div onDoubleClick={handleDoubleClick}>{label}</div>
      )}
    </>
  );
}

MindMapNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.shape({
    label: PropTypes.string.isRequired,
    mindMapId: PropTypes.string.isRequired,
  }).isRequired,
};

export default MindMapNode;
