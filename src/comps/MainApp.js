import React, { useState, useEffect, useContext, Fragment } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEdit,
  faExclamationCircle,
  faMicrophoneAltSlash,
  faTrashAlt
} from '@fortawesome/free-solid-svg-icons'
import { isLogged, req, logout, postReq } from '../helper'

import CustomSelect from './CustomSelect'
import Modal from './Modal'
import { ToastProvider, useToasts } from 'react-toast-notifications';

function MainApp(props) {
  const [loading, setLoading] = useState(true)
  const [Clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const { addToast } = useToasts();

  const [selected, setSelected] = useState(null)
  const [Open, setOpen] = useState(false)
  const [confOpen, setConfOpen] = useState(false)
  const [barcode, setBarcode] = useState('')
  const [submitOptions, setSubmitOptions] = useState({
    total: 0,
    paid: 0,
    modePayment: 0
  })

  const [PaymentOptions, setPaymentOptins] = useState([
    {
      name: 'cash',
      id: 0
    },
    {
      name: 'cheque',
      id: 1
    },
    {
      name: 'effet',
      id: 2
    },
    {
      name: 'versement',
      id: 3
    }
  ])

  useEffect(() => {
    async function handler() {
      await updateClients()
    }

    handler().then(res => {
      //barCodeListener();
      setLoading(false)
    })
  }, [])

  /*  function barCodeListener(){
    let barcode = '';
    document.addEventListener('keydown', function (evt) {
      if(evt.code == 'Enter'){
       if (Number(barcode) != NaN && barcode.length == 13){
        console.log(barcode);
        fetchProduct(barcode);
       }else{
        console.log("failed");
       }
       barcode = '';
      }else{
        
       barcode += evt.key;
       //console.log(barcode);
      }
     });
  } */

  // fetch functions

  async function updateClients() {
    let supResp = await req('getclients')
    setClients(supResp)
    return true
  }

  function getProd(id) {
    for (let i = 0; i < products.length; i++) {
      if (products[i].id == id) {
        return i
      }
    }
    return -1
  }

  function formatPrice(e) {
    let t = e.target
    let val = ''
    if (t.value == '') {
      val = t.attributes.datavalue.value
    } else {
      val = t.value
    }
    t.value = val.split(' ')[0].replace(',', '.') + ' DH'
  }

  function formatField(e) {
    let t = e.target

    let val = ''
    if (t.value == '') {
      val = t.attributes.datavalue.value
    } else {
      val = t.value
    }

    t.value = val
  }

  function handleChange(e) {
    let t = e.target
    let key = t.name
    let id = Number(t.attributes.dataid.value)
    let index = getProd(id)
    console.log(index)
    let copy = [...products]
    console.log(copy)
    let temp = copy[index]
    temp[key] = Number(t.value)
    copy[index] = temp
    setProducts(copy)
  }

  function clearField(e) {
    let t = e.target
    t.value = ''
  }

  function selectClient(val) {
    setSelected(val[0]);
  }

  function handleOpen() {
    setOpen(!Open)
  }

  function updateTotal(total,paid=null) {
    let temp = { ...submitOptions }
    temp.total = total
    if (paid){
      temp.paid = paid
    }
    setSubmitOptions(temp)
  }
  function updatePaid(total) {
    let temp = { ...submitOptions }
    temp.paid = total
    setSubmitOptions(temp)
  }

  function calculateTotal(prods = null) {
    if (!prods) {
      prods = products
    }
    let total = 0
    for (let i = 0; i < prods.length; i++) {
      total += prods[i].quantity * prods[i].price_vente
    }
    return total
  }

  async function fetchProduct(id) {
    let resp = await req('getproduct/' + String(id))
    let temp = [...products]
    let index = getProd(resp.id)
    console.log(index)
    if (resp) {
      if (index != -1) {
        let temp2 = { ...temp[index] }
        if (temp2.quantity + 1 <= resp.quantity){
          resp.quantity = temp2.quantity + 1
        }
        

        temp.splice(index, 1)
        console.log(temp)
        temp.push(resp)
        let t = document.getElementById(String(resp.id))
        t.value = resp.quantity
        console.log('added')
        addToast("Produit : " + resp.p_id + " est ajouté", {
          appearance: "success",
          autoDismiss: true,
        });
      } else {
        if (resp.quantity > 0){
          resp.quantity = 1
          temp.push(resp);
          addToast("Produit : " + resp.p_id + " est ajouté", {
            appearance: "success",
            autoDismiss: true,
          });
        }else{
          addToast("Quantite insuffisente", {
            appearance: "error",
            autoDismiss: true,
          });
        }
        
        
      }
    }

    let tot = calculateTotal(temp)
    updateTotal(tot,tot)
    //updatePaid(tot);
    setProducts(temp)
  }

  function addProduct() {
    let p_id = document.getElementById('p_id').value
    fetchProduct(p_id)
  }

  function handleDel(id) {
    let index = getProd(id)
    let temp = [...products]
    temp.splice(index, 1)
    setProducts(temp)
  }

  function handleBarcode(evt) {
    if (evt.code == 'Enter') {
      if (Number(barcode) != NaN && barcode.length == 13) {
        fetchProduct(barcode)
      } else {
        console.log('failed')
      }
      setBarcode('')
    } else {
      let test = barcode + evt.key
      setBarcode(test)
      //console.log(barcode);
    }
  }

  function handlePaiement(val) {
    let temp = { ...submitOptions }
    temp.modePayment = val[0].id
    setSubmitOptions(temp)
  }

  function changePaid(e) {
    let t = e.target
    let temp = { ...submitOptions }
    temp.paid = Number(t.value)
    setSubmitOptions(temp)
  }

  function formatPrice2(e) {
    let t = e.target
    if (t.value != '') {
      t.value = t.value.split(' ')[0].replace(',', '.') + ' DH'
    }
  }

  async function submitOrder(){
    let body = {
      products,
      sub_options : submitOptions,
      client : selected
    }

    let resp = await postReq('order',body);
    if (resp){
      addToast("Commande Confirmé", {
        appearance: "success",
        autoDismiss: true,
      });
    }
  }

  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }

  const NotFound = (
    <div className="not-found">
      <h2 className="error-text">Aucun Produit</h2>
      <FontAwesomeIcon icon={faExclamationCircle} className="error-circle" />
    </div>
  )

  const DataTable = (
    <Fragment>
      <div className="table-container">
        <div id="table-wrapper">
          <table id="status-table">
            <tbody>
              <tr>
                <th className="date">Nom du Produit</th>
                <th classname="task-title">Quantite</th>
                <th classname="tel">Prix</th>
                <th></th>
              </tr>

              {products.map(e => {
                return (
                  <tr>
                    <td className="date">{e.name}</td>
                    <td className="task-title">
                      <input
                        key={e.id}
                        className="editable-field"
                        name="quantity"
                        id={e.id}
                        onFocus={clearField}
                        onChange={handleChange}
                        onBlur={formatField}
                        datavalue={e.quantity}
                        dataid={e.id}
                        defaultValue={e.quantity}
                      ></input>
                    </td>
                    <td className="status">
                      <input
                        className="editable-field"
                        name="price_vente"
                        onFocus={clearField}
                        onChange={handleChange}
                        datavalue={e.price_vente}
                        dataid={e.id}
                        onBlur={formatPrice}
                        defaultValue={e.price_vente + ' DH'}
                      ></input>
                    </td>
                    <td onClick={() => handleDel(e.id)}>
                      <FontAwesomeIcon icon={faTrashAlt} className="trash" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="submit-container">
          <button
            id="submit"
            onClick={() => {
              setConfOpen(!confOpen)
            }}
            className="modalSubmit"
          >
            Confirmer
          </button>
        </div>
      </div>
    </Fragment>
  )

  const html = (
    <Fragment>
      <Modal open={confOpen} closeFunction={setConfOpen}>
        <h1 className="title-modal m20">Ajout de Produit</h1>
        <div className="modal-input">
          <div className="modal-input-row">
            <CustomSelect
              options={PaymentOptions}
              changeFunc={handlePaiement}
              label="name"
              multi={false}
              values={PaymentOptions.filter(
                e => e.id == submitOptions.modePayment
              )}
              fvalue="id"
              placeholder="Mode de paiement"
            />
          </div>

          <div className="modal-input-row">
            <div className="modal-input-row">
              <div className="input-wrapper">
                <label for="achat">Total</label>
                <input
                  type="text"
                  className="input-field"
                  readOnly={true}
                  placeholder={submitOptions.total + ' DH'}
                  onBlur={formatPrice2}
                  id="achat"
                ></input>
              </div>
              <div className="input-wrapper">
                <label for="vente">Montant payé</label>
                <input
                  type="text"
                  placeholder="0 DH"
                  defaultValue={submitOptions.paid + ' DH'}
                  className="input-field"
                  onChange={changePaid}
                  onBlur={formatPrice2}
                  id="vente"
                ></input>
              </div>
            </div>
          </div>

          <button
            id="submit"
            onClick={submitOrder}
            className="modalSubmit"
          >
            Creer
          </button>
        </div>
      </Modal>

      <Modal open={Open} closeFunction={setOpen}>
        <h1 className="title-modal m20">Ajout de Produit</h1>
        <div className="modal-input">
          <div className="input-wrapper">
            <label for="name">ID</label>
            <input className="input-field" type="text" id="p_id"></input>
            <button id="submit" onClick={addProduct} className="modalSubmit">
              Ajouter
            </button>
          </div>
        </div>
      </Modal>

      <section onKeyDown={handleBarcode} tabIndex="0" className="card Supplier">
        <h1 className="card-title text-center">Vente</h1>
        <div className="filtre-row">
          <div className="filtre-group">
            <CustomSelect
              options={Clients}
              changeFunc={selectClient}
              label="name"
              fvalue="id"
              placeholder="Choisir un Client"
            />
          </div>

          <button
            class="btn-main"
            onClick={() => {
              handleOpen()
            }}
          >
            Ajouter
          </button>
        </div>

        {products.length == 0 ? NotFound : DataTable}
      </section>
    </Fragment>
  )

  const loader = (
    <div className="animation-container">
      <div className="lds-facebook">
        <div />
        <div />
        <div />
      </div>
    </div>
  )

  return loading ? loader : html
}

export default MainApp
