const express = require('express');
const mysql = require('mysql');

const app = express();
const port = 3010; // Choose the desired port number

// MySQL database connection configuration
const connection = mysql.createConnection({
  host: '149.28.189.125',
  user: 'awkdrhpgbw',
  password: '9YKC2thkPk',
  database: 'awkdrhpgbw',
});

let baseURL = 'https://studdog.app/wp-content'; 

// Connect to the MySQL database
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database: ', err);
      return;
    }
    console.log('Connected to the database');
  });

  // Define a route to fetch data
  app.get('/api/posts', (req, res) => {
    const firstQuery = "SELECT post_name FROM wp_posts WHERE post_type = 'rz_listing' AND post_status = 'publish'";
    
    connection.query(firstQuery, (error, results) => {
      if (error) {
        console.error('Error executing the first query: ', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      
      const postNames = results.map((row) => row.post_name);
      
      const secondQuery = `SELECT * FROM wp_postmeta WHERE post_id IN (SELECT ID FROM wp_posts WHERE post_type = 'rz_listing' AND post_status = 'publish' AND post_name IN (${postNames.map(() => '?').join(',')}))`;
      
      connection.query(secondQuery, postNames, (error, results) => {
        if (error) {
          console.error('Error executing the second query: ', error);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }
        
        res.json(results);
      });
    });
  });


  app.get('/api/posts/:postID', (req, res) => {
    let postID = req.params.postID;

    let sql = `SELECT meta_value FROM wp_postmeta WHERE post_id = ${postID} AND meta_key = 'rz_gallery'`;

    connection.query(sql, function(err, result) {
        if (err) throw err;

        let metaValue = result[0].meta_value;

        let galleryImages;
        try {
            galleryImages = JSON.parse(metaValue);
        } catch (error) {
            console.error('Error parsing meta_value JSON: ', error);
            return res.status(500).json({ error: 'Error parsing meta_value JSON' });
        }

        let imageIDs = galleryImages.map(item => item.id);

        let imageLinks = [];
        for(let i = 0; i < imageIDs.length; i++) {
            let imageID = imageIDs[i];
            let sql = `SELECT guid FROM wp_posts WHERE ID = ${imageID} AND post_type = 'attachment'`;
            connection.query(sql, function(err, result) {
                if (err) throw err;

                if (result.length > 0) {
                    let filePath = result[0].guid;
                    let imageURL = baseURL + filePath.split('wp-content')[1];
                    imageLinks.push(imageURL);
                }

                if (i == imageIDs.length - 1) {
                    res.send(imageLinks);
                }
            });
        }
    });
});

  

  // Start the server
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
