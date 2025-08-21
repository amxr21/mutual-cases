import Image from 'next/image'

import { Label } from './index'

import { starsEmoji } from '../constants/imags';

function getDriveDirectLink(url) {
  // Try to capture ID from /d/FILE_ID or ?id=FILE_ID
  const regex = /\/d\/([a-zA-Z0-9_-]+)|id=([a-zA-Z0-9_-]+)/;
  const match = url?.match(regex);
//   console.log(match[1],'this is the match');
  
  const fileId = match ? (match[1] || match[2]) : null;

  console.log(`https://drive.google.com/thumbnail?id=${fileId}`);
  if (!fileId) return null; // not a valid drive link
    
  
  return `https://drive.google.com/thumbnail?id=${fileId}`;
}



function ProductImage({ trend, imageUrl }) {

    // console.log(getDriveDirectLink(imageUrl));
    

  return (
    <div className='relative bg-gray-400 rounded-lg overflow-hidden min-h-48'>
        { getDriveDirectLink() && <Image src={getDriveDirectLink(imageUrl)} alt='image' /> }
        {
            trend && <Label key="trend" text="Trend" emoji={starsEmoji} />
        }
    </div>
  )
}

export default ProductImage