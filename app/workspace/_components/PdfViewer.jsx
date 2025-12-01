import React from 'react'

function PdfViewer({fileUrl}) {
  return (
    <div>
      <iframe src={fileUrl+'#toolbar=0'} width="100%" height="90vh" className='h-[90vh]'></iframe>
    </div>
  )
}

export default PdfViewer